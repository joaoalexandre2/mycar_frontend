import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import api from "../../services/api";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext } from "../../contexts/authContextDefinition";
import { MeusVeiculos } from "./MeusVeiculos";
import { Comparador } from "./Comparador";

type Parametros = Record<string, unknown>;

function veiculoApi(id: number, placa: string, modelo = "Uno") {
  return { id, apelido: null, placa, marca: "Fiat", modelo, ano: 2018 };
}

function pagina(
  dados: unknown[],
  atual: number,
  ultima: number,
  total: number,
) {
  return {
    data: {
      data: dados,
      meta: { current_page: atual, last_page: ultima, per_page: 10, total },
      resumo: { total, valorTotalFipe: 0 },
    },
  };
}

describe("MeusVeiculos: excluir o último veículo da página", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderizar() {
    return render(
      <AuthContext.Provider
        value={{
          usuario: { id: 1, name: "Ana", email: "a@mycar.local", perfil: "pessoa" },
          autenticado: true,
          entrar: async () => {},
          sair: async () => {},
          atualizarUsuario: () => {},
        }}
      >
        <NotificacoesProvider>
          <MemoryRouter>
            <MeusVeiculos />
          </MemoryRouter>
        </NotificacoesProvider>
      </AuthContext.Provider>,
    );
  }

  it("volta para a página anterior em vez de mostrar a lista vazia", async () => {
    let removido = false;
    const paginasPedidas: number[] = [];

    vi.spyOn(api, "get").mockImplementation(
      async (url: string, config?: { params?: Parametros }) => {
        if (url !== "/conta/veiculos") throw new Error(`inesperado: ${url}`);

        const numero = Number(config?.params?.page ?? 1);
        paginasPedidas.push(numero);

        const primeiros = Array.from({ length: 10 }, (_, i) =>
          veiculoApi(i + 1, `AAA${i}B${i}${i}`),
        );

        if (numero === 1) {
          return pagina(primeiros, 1, removido ? 1 : 2, removido ? 10 : 11) as never;
        }

        // Página 2 tinha só um veículo; depois de removido, fica vazia.
        return pagina(
          removido ? [] : [veiculoApi(11, "ZZZ9Z99", "Gol")],
          2,
          removido ? 1 : 2,
          removido ? 10 : 11,
        ) as never;
      },
    );
    vi.spyOn(api, "delete").mockImplementation(async () => {
      removido = true;

      return { data: {} } as never;
    });

    renderizar();

    await screen.findByText("Página 1 de 2");
    // Deixa passar o timer do debounce da busca, que roda logo ao abrir a tela.
    await new Promise((resolve) => setTimeout(resolve, 600));
    await userEvent.click(screen.getByRole("button", { name: /próxima/i }));
    await screen.findByText("Página 2 de 2");

    // Um único veículo na página 2: remover.
    await userEvent.click(screen.getByRole("button", { name: "Remover" }));
    const dialogo = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Remover" }));

    // A página 2 voltou vazia: a tela recua para a 1 e mostra os veículos.
    await waitFor(() => expect(screen.getByText("Página 1 de 1")).toBeInTheDocument());
    expect(paginasPedidas.at(-1)).toBe(1);
    expect(
      screen.queryByText(/ainda não cadastrou nenhum veículo/i),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("article").length).toBeGreaterThan(0);
  });

  it("ir para a página 2 logo ao abrir a tela não é desfeito pelo timer da busca", async () => {
    vi.spyOn(api, "get").mockImplementation(
      async (_url: string, config?: { params?: Parametros }) => {
        const numero = Number(config?.params?.page ?? 1);
        const itens = Array.from({ length: 10 }, (_, i) =>
          veiculoApi(i + 1 + (numero - 1) * 10, `BBB${numero}C${i}${i}`),
        );

        return pagina(itens, numero, 2, 20) as never;
      },
    );

    renderizar();

    await screen.findByText("Página 1 de 2");
    // Vai para a 2 antes de o timer de 400 ms da busca disparar.
    await userEvent.click(screen.getByRole("button", { name: /próxima/i }));
    await screen.findByText("Página 2 de 2");

    await new Promise((resolve) => setTimeout(resolve, 700));

    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
  });

  it("sem nenhum veículo cadastrado continua mostrando o convite para cadastrar", async () => {
    vi.spyOn(api, "get").mockResolvedValue(pagina([], 1, 1, 0) as never);

    renderizar();

    expect(
      await screen.findByText(/ainda não cadastrou nenhum veículo/i),
    ).toBeInTheDocument();
  });
});

describe("Comparador: medida do pneu", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function ficha(medida: string | null) {
    return {
      data: {
        veiculo: { nome: "Fiat Uno", placa: "ABC1D23", marca: "Fiat", modelo: "Uno", ano: 2018 },
        fipe: null,
        fipe_status: "sem_codigo",
        especificacoes: [],
        dados_modelo: null,
        manutencao: medida ? { pneu_medida: medida } : null,
      },
    };
  }

  it("ao escolher “Sem veículo” não fica a medida do veículo anterior", async () => {
    vi.spyOn(api, "get").mockImplementation(async (url: string) => {
      if (url === "/conta/veiculos") {
        return pagina([veiculoApi(1, "ABC1D23"), veiculoApi(2, "XYZ9K88", "Gol")], 1, 1, 2) as never;
      }
      if (url === "/conta/veiculos/1/ficha-tecnica") return ficha("185/65 R15") as never;
      if (url === "/conta/veiculos/2/ficha-tecnica") return ficha(null) as never;

      throw new Error(`inesperado: ${url}`);
    });

    render(
      <MemoryRouter>
        <Comparador />
      </MemoryRouter>,
    );

    const campo = await screen.findByLabelText(/medida do pneu/i);

    await waitFor(() => expect(campo).toHaveValue("185/65 R15"));
    expect(screen.getByText(/tirada da ficha técnica/i)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText(/^veículo/i), "");

    expect(campo).toHaveValue("");
    expect(screen.queryByText(/tirada da ficha técnica/i)).not.toBeInTheDocument();
  });

  it("ao trocar de veículo sem medida salva, o campo não guarda a do anterior", async () => {
    vi.spyOn(api, "get").mockImplementation(async (url: string) => {
      if (url === "/conta/veiculos") {
        return pagina([veiculoApi(1, "ABC1D23"), veiculoApi(2, "XYZ9K88", "Gol")], 1, 1, 2) as never;
      }
      if (url === "/conta/veiculos/1/ficha-tecnica") return ficha("185/65 R15") as never;
      if (url === "/conta/veiculos/2/ficha-tecnica") return ficha(null) as never;

      throw new Error(`inesperado: ${url}`);
    });

    render(
      <MemoryRouter>
        <Comparador />
      </MemoryRouter>,
    );

    const campo = await screen.findByLabelText(/medida do pneu/i);
    await waitFor(() => expect(campo).toHaveValue("185/65 R15"));

    await userEvent.selectOptions(screen.getByLabelText(/^veículo/i), "2");

    await waitFor(() => expect(campo).toHaveValue(""));
    expect(screen.queryByText(/tirada da ficha técnica/i)).not.toBeInTheDocument();
  });
});
