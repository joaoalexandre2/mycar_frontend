import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "../services/api";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";
import { obterToken, obterUsuarioLogado } from "../utils/authStorage";

function Painel() {
  const { usuario, autenticado, sair } = useAuth();

  return (
    <div>
      <p>{autenticado ? `Logado: ${usuario?.name}` : "Deslogado"}</p>
      <button onClick={() => void sair()}>Sair</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("mycar_token", "token-abc");
    localStorage.setItem(
      "mycar_usuario",
      JSON.stringify({ id: 1, name: "Fulano", email: "f@mycar.local" }),
    );
  });

  it("sair() derruba a sessão na tela e no aparelho mesmo com a API fora do ar", async () => {
    // A releitura do usuário ao abrir o app também falha: o app segue com o
    // que está guardado.
    vi.spyOn(api, "get").mockRejectedValue(new Error("rede fora do ar"));
    vi.spyOn(api, "post").mockRejectedValue(new Error("rede fora do ar"));

    render(
      <AuthProvider>
        <Painel />
      </AuthProvider>,
    );

    expect(screen.getByText("Logado: Fulano")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(await screen.findByText("Deslogado")).toBeInTheDocument();
    expect(obterToken()).toBeNull();
    expect(obterUsuarioLogado()).toBeNull();
  });
});
