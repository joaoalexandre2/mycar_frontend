import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import api from "./services/api";
import { NotificacoesProvider } from "./contexts/NotificacoesProvider";
import { AuthContext } from "./contexts/authContextDefinition";
import type { Usuario } from "./types/auth";
import type { Cliente } from "./types/cliente";
import { clientesService } from "./services/clientes";
import { AppLayout } from "./App";
import { Header } from "./components/layout/Header";
import { Clientes } from "./pages/Clientes/Clientes";

// As rotas reais carregam telas inteiras e chamam a API: aqui só importa a
// estrutura da página.
vi.mock("./routes/RotasOficina", () => ({
  default: () => <p>conteúdo da oficina</p>,
}));
vi.mock("./routes/RotasConta", () => ({
  default: () => <p>conteúdo da conta</p>,
}));

const oficina: Usuario = { id: 1, name: "Oficina", email: "o@mycar.local", perfil: "oficina" };
const frota: Usuario = { id: 3, name: "Frota", email: "f@mycar.local", perfil: "frota" };

function comUsuario(usuario: Usuario, rota: string, filho: React.ReactNode) {
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
        <MemoryRouter initialEntries={[rota]}>{filho}</MemoryRouter>
      </NotificacoesProvider>
    </AuthContext.Provider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("estrutura da página", () => {
  it("tem um link para pular ao conteúdo, o cabeçalho fora do <main> e o <main> focável", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    comUsuario(oficina, "/", <AppLayout />);

    const pular = screen.getByRole("link", { name: "Pular para o conteúdo" });
    const principal = await screen.findByRole("main");
    const cabecalho = screen.getByRole("banner");

    expect(pular).toHaveAttribute("href", "#conteudo");
    expect(principal).toHaveAttribute("id", "conteudo");
    expect(principal).toHaveAttribute("tabindex", "-1");

    // O banner não está dentro do main.
    expect(within(principal).queryByRole("banner")).not.toBeInTheDocument();
    expect(principal.contains(cabecalho)).toBe(false);

    // O link é o primeiro item da ordem do documento (antes do menu).
    const todos = Array.from(document.body.querySelectorAll("a, button"));
    expect(todos[0]).toBe(pular);
  });
});

describe("título do documento", () => {
  it.each([
    ["/", oficina, "Dashboard · MyCar"],
    ["/clientes", oficina, "Clientes · MyCar"],
    ["/agenda", frota, "Agenda de veículos · MyCar"],
  ])("%s mostra o nome da tela na aba", (rota, usuario, esperado) => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    comUsuario(usuario, rota, <Header aoAbrirMenu={() => {}} />);

    expect(document.title).toBe(esperado);
  });
});

describe("lista de clientes: buscas e botões com nome", () => {
  const maria: Cliente = {
    id: 1,
    nome: "Maria Souza",
    cpf: "12345678901",
    telefone: "(51) 99999-0000",
    email: null,
    ativo: true,
    quantidadeVeiculos: 2,
    dataCadastro: "2026-01-01",
  };

  it("a busca e o filtro têm nome, e Editar/Excluir dizem de quem são", async () => {
    vi.spyOn(clientesService, "listarPaginado").mockResolvedValue({
      dados: [maria],
      paginaAtual: 1,
      totalPaginas: 1,
      totalRegistros: 1,
      resumo: { total: 1, ativos: 1, inativos: 0, totalVeiculos: 2 },
    });

    comUsuario(oficina, "/clientes", <Clientes />);

    expect(await screen.findByRole("button", { name: "Editar Maria Souza" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir Maria Souza" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Buscar cliente" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Filtrar clientes por status" })).toBeInTheDocument();
  });
});
