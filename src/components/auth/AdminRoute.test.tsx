import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./AdminRoute";
import {
  AuthContext,
  type AuthContextValor,
} from "../../contexts/authContextDefinition";

const contextoBase: AuthContextValor = {
  usuario: null,
  autenticado: true,
  entrar: async () => {},
  sair: async () => {},
  atualizarUsuario: () => {},
};

function renderComAuth(valor: AuthContextValor) {
  return render(
    <AuthContext.Provider value={valor}>
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div>Painel do operador</div>} />
          </Route>
          <Route path="/" element={<div>Início</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("AdminRoute", () => {
  it("mostra o painel para o administrador da plataforma", () => {
    renderComAuth({
      ...contextoBase,
      usuario: { id: 1, name: "Dono", email: "dono@mycar.local", admin: true },
    });

    expect(screen.getByText("Painel do operador")).toBeInTheDocument();
  });

  it("manda para o início quem é de uma oficina comum", () => {
    renderComAuth({
      ...contextoBase,
      usuario: { id: 2, name: "Oficina", email: "o@mycar.local", admin: false },
    });

    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.queryByText("Painel do operador")).not.toBeInTheDocument();
  });

  it("manda para o início quando a sessão antiga não traz o campo admin", () => {
    renderComAuth({
      ...contextoBase,
      usuario: { id: 3, name: "Antigo", email: "a@mycar.local" },
    });

    expect(screen.getByText("Início")).toBeInTheDocument();
  });
});
