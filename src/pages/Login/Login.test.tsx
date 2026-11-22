import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Login } from "./Login";
import {
  AuthContext,
  type AuthContextValor,
} from "../../contexts/authContextDefinition";
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import api from "../../services/api";
import { salvarSessao } from "../../utils/authStorage";
import { gravarAvisoDeSessaoExpirada } from "../../utils/avisoDeSessao";
import type { Usuario } from "../../types/auth";

/** Adaptador falso do axios: toda chamada volta 401. */
const adaptador401: AxiosAdapter = async (config) => {
  throw new AxiosError("401", "ERR_BAD_REQUEST", config, null, {
    status: 401,
    statusText: "Unauthorized",
    headers: {},
    config: config as InternalAxiosRequestConfig,
    data: { message: "Credenciais inválidas." },
  });
};

const mockNavigate = vi.fn();

// Mock parcial: mantém MemoryRouter/useLocation reais (precisamos deles
// de verdade), só troca useNavigate por um espião que dá pra checar.
vi.mock("react-router-dom", async () => {
  const original =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...original,
    useNavigate: () => mockNavigate,
  };
});

function renderLogin(entrar: AuthContextValor["entrar"]) {
  const contexto: AuthContextValor = {
    usuario: null,
    autenticado: false,
    entrar,
    sair: async () => {},
  };

  return render(
    <AuthContext.Provider value={contexto}>
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("Login", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("renderiza os campos de e-mail, senha e o botão de entrar", () => {
    renderLogin(vi.fn());

    expect(
      screen.getByPlaceholderText("voce@exemplo.com"),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("********")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Entrar" }),
    ).toBeInTheDocument();
  });

  it("envia o e-mail e a senha digitados e navega para a home ao logar com sucesso", async () => {
    const entrar = vi.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderLogin(entrar);

    await usuario.type(
      screen.getByPlaceholderText("voce@exemplo.com"),
      "admin@mycar.local",
    );
    await usuario.type(screen.getByPlaceholderText("********"), "mycar@123");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    expect(entrar).toHaveBeenCalledWith({
      email: "admin@mycar.local",
      password: "mycar@123",
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("mostra mensagem de erro e não navega quando o login falha", async () => {
    const entrar = vi.fn().mockRejectedValue(new Error("falha de rede"));
    const usuario = userEvent.setup();

    renderLogin(entrar);

    await usuario.type(
      screen.getByPlaceholderText("voce@exemplo.com"),
      "admin@mycar.local",
    );
    await usuario.type(
      screen.getByPlaceholderText("********"),
      "senha-errada",
    );
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("Não foi possível concluir a operação."),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("Login: aviso de sessão expirada", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("mostra \"Sua sessão expirou\" uma única vez depois de um 401 com sessão ativa", async () => {
    salvarSessao({ id: 1, name: "Ana", email: "ana@x.com" } as Usuario);
    // 401 de uma chamada qualquer com a sessão ativa (o jsdom não navega).
    vi.spyOn(console, "error").mockImplementation(() => {});
    await api.get("/conta/usos", { adapter: adaptador401 }).catch(() => {});

    const { unmount } = renderLogin(vi.fn());

    expect(screen.getByRole("status")).toHaveTextContent(
      "Sua sessão expirou. Entre de novo para continuar.",
    );

    unmount();
    renderLogin(vi.fn());

    expect(screen.queryByText(/sessão expirou/i)).not.toBeInTheDocument();
  });

  it("senha errada no próprio login não mostra \"sessão expirou\"", async () => {
    const entrar = vi.fn(async (payload: { email: string; password: string }) => {
      await api.post("/login", payload, { adapter: adaptador401 });
    });
    const usuario = userEvent.setup();

    renderLogin(entrar);

    await usuario.type(screen.getByPlaceholderText("voce@exemplo.com"), "ana@x.com");
    await usuario.type(screen.getByPlaceholderText("********"), "errada");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Credenciais inválidas.")).toBeInTheDocument();
    expect(screen.queryByText(/sessão expirou/i)).not.toBeInTheDocument();
  });

  it("o aviso some quando a pessoa tenta entrar de novo", async () => {
    gravarAvisoDeSessaoExpirada();
    const usuario = userEvent.setup();

    renderLogin(vi.fn().mockRejectedValue(new Error("x")));
    expect(screen.getByText(/sessão expirou/i)).toBeInTheDocument();

    await usuario.type(screen.getByPlaceholderText("voce@exemplo.com"), "ana@x.com");
    await usuario.type(screen.getByPlaceholderText("********"), "x");
    await usuario.click(screen.getByRole("button", { name: "Entrar" }));

    await screen.findByText("Não foi possível concluir a operação.");
    expect(screen.queryByText(/sessão expirou/i)).not.toBeInTheDocument();
  });
});
