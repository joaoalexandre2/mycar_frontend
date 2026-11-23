import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { contaService } from "../../services/conta/veiculos";
import { motoristasService } from "../../services/frota";
import { multasService } from "../../services/frotaDiferenciais";import type { Multa } from "../../types/frota";
import { Multas } from "./Multas";

afterEach(() => vi.restoreAllMocks());

function multa(numero: number): Multa {
  return {
    id: numero,
    data_hora: "2026-10-20T14:00:00-03:00",
    descricao: `Infração ${numero}`,
    valor: "130.16",
    pontos: 4,
    situacao: "aberta",
    observacoes: null,
    veiculo: { id: 1, placa: "AAA1A11", nome: "Fiat Strada" },
    uso_veiculo_id: null,
    motorista: { id: 2, nome: "Maria" },
  };
}

function renderizar() {
  return render(
    <NotificacoesProvider>
      <Multas />
    </NotificacoesProvider>,
  );
}

describe("Multas da frota", () => {
  it("anda pelas páginas da lista e volta à primeira ao trocar a situação", async () => {
    const user = userEvent.setup();
    const listar = vi.spyOn(multasService, "listar").mockImplementation(async (filtro = {}) => {
      const pagina = filtro.pagina ?? 1;

      return { dados: [multa(pagina)], paginaAtual: pagina, totalPaginas: 2, totalRegistros: 2 };
    });

    renderizar();

    expect(await screen.findByText("Infração 1")).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Próxima/ }));

    expect(await screen.findByText("Infração 2")).toBeInTheDocument();
    expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Próxima/ })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("Filtrar por situação"), "paga");

    await waitFor(() => expect(listar).toHaveBeenLastCalledWith({ situacao: "paga", pagina: 1 }));
    expect(await screen.findByText("Infração 1")).toBeInTheDocument();
  });

  it("volta para a última página com multas quando a página atual fica vazia", async () => {
    const user = userEvent.setup();
    const listar = vi.spyOn(multasService, "listar").mockImplementation(async (filtro = {}) => {
      if (filtro.pagina === 2) {
        return { dados: [], paginaAtual: 2, totalPaginas: 1, totalRegistros: 1 };
      }

      return { dados: [multa(1)], paginaAtual: 1, totalPaginas: 2, totalRegistros: 2 };
    });

    renderizar();

    await user.click(await screen.findByRole("button", { name: /Próxima/ }));

    await waitFor(() => expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 1 })));
    expect(listar).toHaveBeenCalledTimes(3);
    expect(await screen.findByText("Infração 1")).toBeInTheDocument();
  });

  it("mostra o valor no formato de moeda do app e não repete o título do cabeçalho", async () => {
    vi.spyOn(multasService, "listar").mockResolvedValue({
      dados: [{ ...multa(1), valor: "1500.5" }],
      paginaAtual: 1,
      totalPaginas: 1,
      totalRegistros: 1,
    });

    renderizar();

    // Antes saía "R$ 1500,50" (toFixed à mão, sem o separador de milhar).
    expect(await screen.findByText(/R\$\s1\.500,50/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("avisa quando os motoristas não carregam, sem travar o registro, e tenta de novo", async () => {
    const user = userEvent.setup();
    vi.spyOn(multasService, "listar").mockResolvedValue({ dados: [], paginaAtual: 1, totalPaginas: 0, totalRegistros: 0 });
    vi.spyOn(contaService, "listarVeiculos").mockResolvedValue({ dados: [] } as unknown as Awaited<ReturnType<typeof contaService.listarVeiculos>>);
    const listarMotoristas = vi
      .spyOn(motoristasService, "listar")
      .mockRejectedValueOnce(new Error("rede fora"))
      .mockResolvedValueOnce([{ id: 2, nome: "Maria", telefone: null, cnhNumero: null, cnhValidade: null, ativo: true }]);

    renderizar();

    await user.click(await screen.findByRole("button", { name: /Nova multa/ }));

    const aviso = await screen.findByText(/Não foi possível carregar a lista de motoristas/);
    const caixa = aviso.closest("[data-tom]") as HTMLElement;
    expect(caixa).toHaveAttribute("data-tom", "warning");
    // O resto do formulário segue utilizável.
    expect(screen.getByRole("button", { name: "Registrar multa" })).toBeEnabled();
    expect(screen.getByLabelText("Infração")).toBeEnabled();

    await user.click(within(caixa).getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByRole("option", { name: "Maria" })).toBeInTheDocument();
    expect(screen.queryByText(/Não foi possível carregar a lista de motoristas/)).not.toBeInTheDocument();
    expect(listarMotoristas).toHaveBeenCalledTimes(2);
  });
});
