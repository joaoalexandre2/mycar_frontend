import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { contaService } from "../../services/conta/veiculos";
import { motoristasService, centrosCustoService } from "../../services/frota";
import { categoriasDeDespesaService, despesasAvulsasService, financeiroService } from "../../services/financeiro";
import type { DespesaAvulsa, ResumoFinanceiro } from "../../types/financeiro";
import { Financeiro } from "./Financeiro";

afterEach(() => vi.restoreAllMocks());

const resumo: ResumoFinanceiro = {
  total: 480,
  combustivel: { total: 200, litros: 40 },
  servicos: { total: 150, quantidade: 1 },
  avulsas: { total: 30, itens: [{ categoriaId: 1, rotulo: "Pedágio", total: 30, quantidade: 1 }] },
  multas: { total: 100, quantidade: 1 },
  seguro: { valorAnualTotal: 3000 },
  porVeiculo: [
    { veiculoId: 1, veiculo: "Fiat Strada", placa: "AAA1A11", combustivel: 200, servicos: 150, avulsas: 30, multas: 100, total: 480, kmRodados: 100, custoPorKm: 4.8 },
  ],
  porMotorista: [{ motoristaId: 2, nome: "João", avulsas: 30, multas: 100, total: 130 }],
  porCentro: [],
  mensal: [{ mes: "2026-03", combustivel: 200, servicos: 150, avulsas: 30, multas: 100, total: 480 }],
  indicadores: {
    custoTotal: 480,
    custoMedioPorVeiculo: 480,
    kmRodados: 100,
    custoPorKm: 4.8,
    veiculoMaiorCusto: { veiculoId: 1, placa: "AAA1A11", valor: 480 },
    veiculoMaiorManutencao: { veiculoId: 1, placa: "AAA1A11", valor: 150 },
  },
};

function renderizar() {
  return render(
    <NotificacoesProvider>
      <Financeiro />
    </NotificacoesProvider>,
  );
}

function prepararServicos() {
  vi.spyOn(financeiroService, "resumo").mockResolvedValue(resumo);
  vi.spyOn(despesasAvulsasService, "listar").mockResolvedValue({ dados: [], paginaAtual: 1, totalPaginas: 1, totalRegistros: 0 });
  vi.spyOn(categoriasDeDespesaService, "listar").mockResolvedValue([
    { id: 1, nome: "Pedágio", ativo: true },
    { id: 2, nome: "Lavagem", ativo: true },
  ]);
  vi.spyOn(contaService, "listarVeiculos").mockResolvedValue({ dados: [], paginaAtual: 1, totalPaginas: 1, totalRegistros: 0 } as never);
  vi.spyOn(motoristasService, "listar").mockResolvedValue([{ id: 2, nome: "João" }] as never);
  vi.spyOn(centrosCustoService, "listar").mockResolvedValue([]);
}

describe("Financeiro da frota", () => {
  it("mostra os indicadores e a tabela por veículo com o que foi consolidado", async () => {
    prepararServicos();

    renderizar();

    expect(await screen.findByText("Custo total")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 480,00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("AAA1A11").length).toBeGreaterThan(0);
    expect(screen.getByText(/Seguro: R\$ 3\.000,00 por ano/)).toBeInTheDocument();
  });

  it("registra uma despesa avulsa com a categoria e o valor escolhidos", async () => {
    prepararServicos();
    const criar = vi.spyOn(despesasAvulsasService, "criar").mockResolvedValue({} as DespesaAvulsa);
    const user = userEvent.setup();

    renderizar();

    await user.click(await screen.findByRole("button", { name: /Nova despesa/ }));
    await user.selectOptions(screen.getByLabelText("Categoria"), "Lavagem");
    await user.type(screen.getByLabelText("Valor (R$)"), "45,5");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith(
        expect.objectContaining({ categoriaId: 2, valor: 45.5, veiculoId: null, motoristaId: null, centroCustoId: null }),
      ),
    );
  });
});
