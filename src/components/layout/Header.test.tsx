import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import api from "../../services/api";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext } from "../../contexts/authContextDefinition";
import type { Usuario } from "../../types/auth";
import { Header } from "./Header";

type Parametros = Record<string, unknown>;

function pagina(dados: unknown[], total = dados.length) {
  return {
    data: {
      data: dados,
      meta: { current_page: 1, last_page: 1, per_page: 5, total },
      resumo: {},
    },
  };
}

function renderizar(usuario: Usuario) {
  return render(
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: true,
        entrar: async () => {},
        sair: async () => {},
        atualizarUsuario: () => {},
      }}
    >
      <NotificacoesProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Header aoAbrirMenu={() => {}} />} />
            <Route path="/veiculos" element={<p>Tela de veículos</p>} />
            <Route path="/manutencoes" element={<p>Tela de manutenções</p>} />
          </Routes>
        </MemoryRouter>
      </NotificacoesProvider>
    </AuthContext.Provider>,
  );
}

const oficina: Usuario = { id: 1, name: "Oficina", email: "o@mycar.local", perfil: "oficina" };
const pessoa: Usuario = { id: 2, name: "Ana", email: "a@mycar.local", perfil: "pessoa" };

function manutencao(id: number, tipo: string, status: string) {
  return {
    id,
    veiculo_id: 3,
    tipo,
    descricao: "",
    valor: null,
    data_manutencao: "2026-06-01",
    quilometragem: null,
    proxima_data: "2026-10-01",
    proxima_quilometragem: null,
    status,
    pecas: [],
    veiculo: {
      id: 3,
      cliente_id: 1,
      placa: "ABC1D23",
      marca: "Fiat",
      modelo: "Uno",
      ano: 2018,
    },
  };
}

describe("Header: sininho de atualizações (oficina)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mostra o ponto vermelho e lista as manutenções que pedem atenção", async () => {
    vi.spyOn(api, "get").mockImplementation(
      async (_url: string, config?: { params?: Parametros }) => {
        const status = config?.params?.status;

        if (status === "atrasada") return pagina([manutencao(1, "Troca de óleo", "atrasada")]) as never;
        if (status === "proxima") return pagina([manutencao(2, "Revisão", "proxima")]) as never;

        return pagina([]) as never;
      },
    );

    renderizar(oficina);

    const sino = await screen.findByRole("button", { name: "Atualizações: 2 aviso(s)" });
    await userEvent.click(sino);

    const painel = screen.getByRole("region", { name: "Atualizações" });

    expect(within(painel).getByText("Atrasada: Troca de óleo")).toBeInTheDocument();
    expect(within(painel).getByText("Próxima: Revisão")).toBeInTheDocument();
    expect(within(painel).getAllByText("Fiat Uno · ABC1D23")).toHaveLength(2);
  });

  it("sem pendência não mostra ponto vermelho e diz que está tudo em dia", async () => {
    vi.spyOn(api, "get").mockResolvedValue(pagina([]) as never);

    renderizar(oficina);

    const sino = await screen.findByRole("button", { name: "Atualizações" });
    await waitFor(() => expect(sino.querySelector("span")).toBeNull());

    await userEvent.click(sino);

    expect(screen.getByText(/tudo em dia/i)).toBeInTheDocument();
  });

  it("Esc fecha o painel e o link leva às manutenções", async () => {
    vi.spyOn(api, "get").mockResolvedValue(pagina([]) as never);

    renderizar(oficina);

    await userEvent.click(await screen.findByRole("button", { name: "Atualizações" }));
    expect(screen.getByRole("region", { name: "Atualizações" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Atualizações" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Atualizações" }));
    await userEvent.click(screen.getByRole("link", { name: /ver manutenções/i }));

    expect(await screen.findByText("Tela de manutenções")).toBeInTheDocument();
  });

  it("avisa quando não consegue carregar", async () => {
    vi.spyOn(api, "get").mockRejectedValue(new Error("rede fora do ar"));

    renderizar(oficina);

    await userEvent.click(await screen.findByRole("button", { name: "Atualizações" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});

describe("Header: sininho de atualizações (conta)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lista os vencimentos do resumo da conta", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        conta: { nome: "Ana", tipo: "pessoa" },
        total_veiculos: 1,
        valor_total_fipe: 0,
        dias_a_frente: 60,
        vencimentos: [
          {
            tipo: "ipva",
            veiculo_id: 1,
            veiculo: "Fiat Uno",
            placa: "ABC1D23",
            data: "2026-11-01",
            dias: -3,
            valor_estimado: null,
          },
        ],
        consumo: { km_por_litro: null, preco_medio_litro: null, veiculos_com_dados: 0 },
        gasto_mes: { total: 0, combustivel: 0, servicos: 0 },
      },
    } as never);

    renderizar(pessoa);

    await userEvent.click(await screen.findByRole("button", { name: "Atualizações: 1 aviso(s)" }));

    const painel = screen.getByRole("region", { name: "Atualizações" });

    expect(within(painel).getByText("IPVA")).toBeInTheDocument();
    expect(within(painel).getByText("Fiat Uno · ABC1D23")).toBeInTheDocument();
    expect(within(painel).getByText("3 d de atraso")).toBeInTheDocument();
  });
});

describe("Header: busca", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("a lupa abre a busca e encontra clientes e veículos da oficina", async () => {
    const get = vi.spyOn(api, "get").mockImplementation(async (url: string) => {
      if (url === "/clientes") {
        return pagina([
          { id: 1, nome: "Maria Souza", cpf: "11122233344", telefone: "11999990000", ativo: true },
        ]) as never;
      }
      if (url === "/veiculos") {
        return pagina([
          {
            id: 9,
            cliente_id: 1,
            placa: "XYZ9K88",
            marca: "VW",
            modelo: "Gol",
            ano: 2020,
            cliente: { id: 1, nome: "Maria Souza" },
          },
        ]) as never;
      }

      return pagina([]) as never;
    });

    renderizar(oficina);

    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));

    const dialogo = screen.getByRole("dialog", { name: "Buscar" });
    expect(within(dialogo).getByText(/comece a digitar/i)).toBeInTheDocument();

    await userEvent.type(within(dialogo).getByRole("searchbox"), "mar");

    expect(await within(dialogo).findByText("Maria Souza", { selector: "span" })).toBeInTheDocument();
    expect(within(dialogo).getByText("VW Gol")).toBeInTheDocument();
    expect(within(dialogo).getByText("XYZ9K88 · Maria Souza")).toBeInTheDocument();

    expect(get).toHaveBeenCalledWith("/clientes", expect.objectContaining({
      params: expect.objectContaining({ busca: "mar", per_page: 5 }),
    }));
  });

  it("não busca com menos de 2 letras", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue(pagina([]) as never);

    renderizar(oficina);
    get.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await userEvent.type(screen.getByRole("searchbox"), "m");
    await new Promise((resolve) => setTimeout(resolve, 450));

    const buscas = get.mock.calls.filter(([url]) => url === "/clientes" || url === "/veiculos");

    expect(buscas).toHaveLength(0);
  });

  it("avisa quando nada é encontrado", async () => {
    vi.spyOn(api, "get").mockResolvedValue(pagina([]) as never);

    renderizar(oficina);

    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await userEvent.type(screen.getByRole("searchbox"), "zzzz");

    expect(await screen.findByText(/nada encontrado para “zzzz”/i)).toBeInTheDocument();
  });

  it("clicar em um resultado leva à tela e fecha a busca", async () => {
    vi.spyOn(api, "get").mockImplementation(async (url: string) => {
      if (url === "/veiculos") {
        return pagina([
          { id: 9, cliente_id: 1, placa: "XYZ9K88", marca: "VW", modelo: "Gol", ano: 2020 },
        ]) as never;
      }

      return pagina([]) as never;
    });

    renderizar(oficina);

    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await userEvent.type(screen.getByRole("searchbox"), "gol");
    await userEvent.click(await screen.findByRole("link", { name: /VW Gol/ }));

    expect(await screen.findByText("Tela de veículos")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Buscar" })).not.toBeInTheDocument();
  });

  it("na conta busca os veículos da conta", async () => {
    const get = vi.spyOn(api, "get").mockImplementation(async (url: string) => {
      if (url === "/conta/veiculos") {
        return {
          data: {
            data: [
              { id: 4, apelido: "Carro da família", placa: "ABC1D23", marca: "Fiat", modelo: "Uno", ano: 2018 },
            ],
            meta: { current_page: 1, last_page: 1, per_page: 5, total: 1 },
            resumo: { total: 1, valorTotalFipe: 0 },
          },
        } as never;
      }

      return {
        data: {
          vencimentos: [],
          consumo: {},
          gasto_mes: {},
        },
      } as never;
    });

    renderizar(pessoa);

    await userEvent.click(screen.getByRole("button", { name: "Buscar" }));
    await userEvent.type(screen.getByRole("searchbox"), "fam");

    expect(await screen.findByText("Carro da família")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/conta/veiculos", expect.objectContaining({
      params: expect.objectContaining({ busca: "fam" }),
    }));
  });
});
