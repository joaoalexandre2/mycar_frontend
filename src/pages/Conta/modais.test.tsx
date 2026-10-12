import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "../../services/api";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import type { VeiculoConta } from "../../types/conta";
import { AbastecimentosModal } from "./AbastecimentosModal";
import { FotosModal } from "./FotosModal";

const veiculo: VeiculoConta = {
  id: 7,
  apelido: "Carro da família",
  placa: "ABC1D23",
  marca: "Fiat",
  modelo: "Uno",
  ano: 2018,
  anoFabricacao: null,
  anoCompleto: "2018",
  possivelIsencaoIpva: false,
  fotoCapaUrl: null,
  fotoModelo: null,
  uf: "RS",
  ipvaEstimado: null,
  licenciamentoValor: null,
  proximoVencimentoIpva: null,
  proximoVencimentoLicenciamento: null,
  revisaoPrevistaEm: null,
  fipeMarcaId: null,
  fipeModeloId: null,
  fipeAno: null,
  fipeValor: null,
  fipeConsultadoEm: null,
};

describe("modais da conta usam o diálogo acessível", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("abastecimentos: é um diálogo nomeado, com o veículo, e Esc fecha", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        abastecimentos: [],
        resumo: {
          consumo_medio_km_l: null,
          custo_por_km: null,
          total_gasto: 0,
          total_litros: 0,
          preco_medio_litro: null,
          km_atual: null,
          quantidade: 0,
        },
      },
    } as never);
    const aoFechar = vi.fn();

    render(
      <NotificacoesProvider>
        <AbastecimentosModal veiculo={veiculo} onClose={aoFechar} />
      </NotificacoesProvider>,
    );

    expect(
      screen.getByRole("dialog", { name: "Abastecimentos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Carro da família · ABC1D23")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("álbum: Esc fecha primeiro a foto ampliada e só depois o álbum", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        limite: 20,
        fotos: [
          {
            id: 1,
            legenda: "Lateral",
            criada_em: "2026-10-01",
            url: "https://api.exemplo/fotos/1/foto",
            url_miniatura: "https://api.exemplo/fotos/1/miniatura",
          },
        ],
      },
    } as never);
    const aoFechar = vi.fn();

    render(
      <NotificacoesProvider>
        <FotosModal veiculo={veiculo} onClose={aoFechar} />
      </NotificacoesProvider>,
    );

    await userEvent.click(await screen.findByRole("button", { name: /lateral/i }));
    expect(screen.getByRole("dialog", { name: "Foto ampliada" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog", { name: "Foto ampliada" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Álbum de fotos" })).toBeInTheDocument();
    expect(aoFechar).not.toHaveBeenCalled();

    await userEvent.keyboard("{Escape}");

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });
});
