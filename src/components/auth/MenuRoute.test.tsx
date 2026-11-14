import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MenuRoute } from "./MenuRoute";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import type { Perfil, Usuario } from "../../types/auth";

function renderComUsuario(usuario: Partial<Usuario> & { perfil?: Perfil }) {
  const valor: AuthContextValor = {
    usuario: { id: 1, name: "Ana", email: "ana@mycar.local", ...usuario } as Usuario,
    autenticado: true,
    entrar: async () => {},
    sair: async () => {},
    atualizarUsuario: () => {},
  };

  return render(
    <AuthContext.Provider value={valor}>
      <MemoryRouter initialEntries={["/veiculos"]}>
        <Routes>
          <Route element={<MenuRoute menu="veiculos" />}>
            <Route path="/veiculos" element={<div>Veículos da frota</div>} />
          </Route>
          <Route path="/" element={<div>Início</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("MenuRoute", () => {
  it("mostra a tela quando o menu está liberado", () => {
    renderComUsuario({ perfil: "frota", menus: ["agenda", "veiculos"] });

    expect(screen.getByText("Veículos da frota")).toBeInTheDocument();
  });

  it("leva ao início quando a frota não tem o menu", () => {
    renderComUsuario({ perfil: "frota", menus: ["agenda"] });

    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.queryByText("Veículos da frota")).not.toBeInTheDocument();
  });

  it("não barra quem está fora da frota (sem lista de menus)", () => {
    renderComUsuario({ perfil: "pessoa", menus: null });

    expect(screen.getByText("Veículos da frota")).toBeInTheDocument();
  });
});
