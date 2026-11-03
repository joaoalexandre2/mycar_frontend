import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { abastecimentoService } from "../../services/conta";
import { motoristasService } from "../../services/frota";
import type { AbastecimentosDoVeiculo, VeiculoConta } from "../../types/conta";
import { AbastecimentosModal } from "./AbastecimentosModal";

afterEach(() => vi.restoreAllMocks());

const veiculo = { id: 1, placa: "AAA1A11", marca: "Fiat", modelo: "Uno", apelido: null, tipoVeiculo: "carro" } as unknown as VeiculoConta;

const dadosComAlerta: AbastecimentosDoVeiculo = {
  tanqueLitros: null,
  abastecimentos: [
    {
      id: 5,
      data: "2026-05-10",
      km: 1400,
      litros: 40,
      valorTotal: 200,
      tanqueCheio: true,
      combustivel: "gasolina",
      posto: null,
      precoLitro: 5,
      consumoKmL: 5,
      custoPorKm: 0.5,
      hora: "14:35",
      motoristaId: null,
      justificativa: null,
      alertas: [{ codigo: "consumo_fora_do_padrao", mensagem: "Consumo de 5,00 km/l, contra uma média de 10,00 km/l." }],
      comprovanteUrl: null,
      hodometroUrl: null,
    },
  ],
  resumo: {
    consumoMedioKmL: 10,
    custoPorKm: 0.5,
    totalGasto: 200,
    totalLitros: 40,
    precoMedioLitro: 5,
    kmAtual: 1400,
    quantidade: 1,
  },
};

function renderizar() {
  return render(
    <NotificacoesProvider>
      <AbastecimentosModal veiculo={veiculo} onClose={() => undefined} />
    </NotificacoesProvider>,
  );
}

describe("AbastecimentosModal", () => {
  it("mostra o alerta de consumo fora do padrão no abastecimento", async () => {
    vi.spyOn(abastecimentoService, "listar").mockResolvedValue(dadosComAlerta);
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);

    renderizar();

    expect(await screen.findByText(/Consumo de 5,00 km\/l, contra uma média de 10,00 km\/l\./)).toBeInTheDocument();
  });

  it("pede a justificativa quando o km volta e registra depois de explicar", async () => {
    vi.spyOn(abastecimentoService, "listar").mockResolvedValue({ ...dadosComAlerta, abastecimentos: [] });
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    const registrar = vi
      .spyOn(abastecimentoService, "registrar")
      .mockRejectedValueOnce(
        Object.assign(new Error("422"), {
          isAxiosError: true,
          response: {
            status: 422,
            data: {
              errors: {
                km: ["O km não pode ser menor que o do abastecimento anterior (1400 km)."],
                justificativa: ["Há dados fora do padrão. Informe a justificativa para registrar mesmo assim."],
              },
            },
          },
        }),
      )
      .mockResolvedValueOnce({ ...dadosComAlerta, abastecimentos: [] });
    const user = userEvent.setup();

    renderizar();

    await user.type(await screen.findByLabelText("Km no hodômetro"), "1000");
    await user.type(screen.getByLabelText("Litros"), "40");
    await user.type(screen.getByLabelText("Valor pago (R$)"), "200");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByText(/O km não pode ser menor/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Justificativa/), "Odômetro trocado no painel do carro");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() =>
      expect(registrar).toHaveBeenLastCalledWith(1, expect.objectContaining({ km: 1000, justificativa: "Odômetro trocado no painel do carro" })),
    );
  });
});
