import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { contaService } from "../../services/conta/veiculos";
import { motoristasService, centrosCustoService } from "../../services/frota";
import { categoriasDeDespesaService } from "../../services/financeiro";
import { relatoriosService, type RelatorioGerado } from "../../services/relatorios";
import { Relatorios } from "./Relatorios";

afterEach(() => vi.restoreAllMocks());

const relatorio: RelatorioGerado = {
  tipo: "abastecimentos",
  titulo: "Abastecimentos",
  colunas: [
    { chave: "placa", rotulo: "Placa", formato: "texto" },
    { chave: "valor_total", rotulo: "Valor total", formato: "moeda" },
  ],
  linhas: [{ placa: "AAA1A11", valor_total: 200 }],
  totalLinhas: 1,
};

function prepararServicos() {
  vi.spyOn(relatoriosService, "catalogo").mockResolvedValue([
    { tipo: "utilizacao", nome: "Utilização dos veículos", descricao: "Usos por veículo." },
  ]);
  vi.spyOn(relatoriosService, "mostrar").mockResolvedValue(relatorio);
  vi.spyOn(contaService, "listarVeiculos").mockResolvedValue({ dados: [], paginaAtual: 1, totalPaginas: 1, totalRegistros: 0 } as never);
  vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
  vi.spyOn(centrosCustoService, "listar").mockResolvedValue([]);
  vi.spyOn(categoriasDeDespesaService, "listar").mockResolvedValue([]);
}

function renderizar() {
  return render(
    <NotificacoesProvider>
      <Relatorios />
    </NotificacoesProvider>,
  );
}

describe("Relatórios da frota", () => {
  it("mostra as linhas do relatório com os valores formatados", async () => {
    prepararServicos();

    renderizar();

    expect(await screen.findByText("AAA1A11")).toBeInTheDocument();
    expect(screen.getByText("R$ 200,00")).toBeInTheDocument();
    expect(screen.getByText("1 registro(s)")).toBeInTheDocument();
  });

  it("baixa o CSV com o mesmo filtro da tela", async () => {
    prepararServicos();
    const baixar = vi.spyOn(relatoriosService, "baixarCsv").mockResolvedValue(undefined);
    const user = userEvent.setup();

    renderizar();

    await screen.findByText("AAA1A11");
    await user.click(screen.getByRole("button", { name: /Baixar CSV/ }));

    await waitFor(() =>
      expect(baixar).toHaveBeenCalledWith("utilizacao", expect.objectContaining({ de: expect.any(String), ate: expect.any(String) })),
    );
  });
});
