import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Login } from "./Login";
import {
  AuthContext,
  type AuthContextValor,
} from "../../contexts/authContextDefinition";

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
