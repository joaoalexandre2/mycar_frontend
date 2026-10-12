import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import api from "../../services/api";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { Dashboard } from "./Dashboard";

type Parametros = Record<string, unknown>;

function pagina(dados: unknown[], total: number, resumo: unknown = {}) {
  return {
    data: {
      data: dados,
      meta: { current_page: 1, last_page: 1, per_page: dados.length, total },
      resumo,
    },
  };
}

const ordem = {
  id: 12,
  veiculo_id: 3,
  descricao: "Troca de óleo",
  status: "aberta",
  valor: 250,
  data_abertura: "2026-10-01",
  data_fechamento: null,
  veiculo: {
    id: 3,
    cliente_id: 1,
    placa: "ABC1D23",
    marca: "Fiat",
    modelo: "Uno",
    ano: 2018,
    cliente: { id: 1, nome: "Maria Souza" },
  },
};

function manutencao(id: number, status: string, dataManutencao: string) {
  return {
    id,
    veiculo_id: 3,
    tipo: `Serviço ${id}`,
    descricao: "",
    valor: null,
    data_manutencao: dataManutencao,
    quilometragem: null,
    proxima_data: null,
    proxima_quilometragem: null,
    status,
    pecas: [],
  };
}

function simularApi(resumoOrdens: Record<string, unknown>) {
  return vi.spyOn(api, "get").mockImplementation(async (url: string, config?: { params?: Parametros }) => {
    const status = config?.params?.status;

    if (url === "/clientes") return pagina([], 42, {}) as never;
    if (url === "/veiculos") return pagina([], 57, {}) as never;
    if (url === "/ordens-servico") return pagina([ordem], 9, resumoOrdens) as never;
    if (url === "/manutencoes" && status === "atrasada") {
      return pagina([manutencao(1, "atrasada", "2026-08-10"), manutencao(2, "atrasada", "2026-06-01")], 2) as never;
    }
    if (url === "/manutencoes" && status === "proxima") {
      return pagina([manutencao(3, "proxima", "2026-09-20"), manutencao(4, "proxima", "2026-07-15")], 2) as never;
    }

    throw new Error(`requisição inesperada: ${url}`);
  });
}

/** O cartão do topo: o <div> que contém o título (o span) do cartão. */
function cartao(titulo: string) {
  const bloco = screen.getByText(titulo).parentElement?.parentElement;

  if (!bloco) throw new Error(`cartão "${titulo}" não encontrado`);

  return within(bloco);
}

function renderizar() {
  return render(
    <NotificacoesProvider>
      <Dashboard />
    </NotificacoesProvider>,
  );
}

describe("Dashboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("monta os totais pelo resumo do servidor, sem baixar a base inteira", async () => {
    const get = simularApi({
      total: 9,
      abertas: 4,
      emAndamento: 3,
      finalizadas: 2,
      valorTotal: 5000,
      valorFinalizadas: 1234.5,
    });

    renderizar();

    await screen.findByText("Fiat Uno");

    expect(cartao("Clientes").getByText("42")).toBeInTheDocument();
    expect(
      cartao("Clientes").getByText("57 veículo(s) cadastrado(s)"),
    ).toBeInTheDocument();
    expect(cartao("Veículos").getByText("57")).toBeInTheDocument();
    expect(cartao("Ordens abertas").getByText("4")).toBeInTheDocument();
    expect(
      cartao("Ordens abertas").getByText("3 em andamento"),
    ).toBeInTheDocument();
    // Faturamento: só as finalizadas (e não o valorTotal de 5.000).
    expect(cartao("Faturamento").getByText(/1\.234,50/)).toBeInTheDocument();

    // Nenhuma chamada pede a lista completa.
    for (const [, config] of get.mock.calls) {
      const params = (config as { params?: Parametros } | undefined)?.params ?? {};
      expect(params).not.toHaveProperty("all");
      expect(params.per_page).toBeLessThanOrEqual(5);
    }
  });

  it("mostra as ordens recentes com veículo e cliente vindos da relação", async () => {
    simularApi({ total: 1, abertas: 1, emAndamento: 0, finalizadas: 0, valorTotal: 250, valorFinalizadas: 0 });

    renderizar();

    expect(await screen.findByText("Fiat Uno")).toBeInTheDocument();
    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getByText("#0012")).toBeInTheDocument();
  });

  it("junta atrasadas e próximas e mostra as 3 manutenções mais recentes", async () => {
    simularApi({ total: 0, abertas: 0, emAndamento: 0, finalizadas: 0, valorTotal: 0, valorFinalizadas: 0 });

    renderizar();

    // 2026-09-20, 2026-08-10 e 2026-07-15: a de 2026-06-01 fica de fora.
    expect(await screen.findByText("Serviço 3")).toBeInTheDocument();
    expect(screen.getByText("Serviço 1")).toBeInTheDocument();
    expect(screen.getByText("Serviço 4")).toBeInTheDocument();
    expect(screen.queryByText("Serviço 2")).not.toBeInTheDocument();
  });

  it("sem o campo de faturamento (backend antigo) não inventa valor", async () => {
    simularApi({ total: 2, abertas: 1, emAndamento: 0, finalizadas: 1, valorTotal: 800 });

    renderizar();

    await screen.findByText("Fiat Uno");

    expect(screen.queryByText(/800/)).not.toBeInTheDocument();
    expect(cartao("Faturamento").getByText("—")).toBeInTheDocument();
  });
});
