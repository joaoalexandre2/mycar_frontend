import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import {
  AuthContext,
  type AuthContextValor,
} from "../../contexts/authContextDefinition";

const contextoBase: AuthContextValor = {
  usuario: null,
  autenticado: false,
  entrar: async () => {},
  sair: async () => {},
};

function renderComAuth(valor: AuthContextValor) {
  return render(
    <AuthContext.Provider value={valor}>
      <MemoryRouter initialEntries={["/protegido"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route
              path="/protegido"
              element={<div>Conteúdo protegido</div>}
            />
          </Route>
          <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("ProtectedRoute", () => {
  it("mostra o conteúdo da rota quando o usuário está autenticado", () => {
    renderComAuth({
      ...contextoBase,
      autenticado: true,
      usuario: { id: 1, name: "Fulano", email: "f@mycar.local" },
    });

    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });

  it("redireciona para /login quando o usuário não está autenticado", () => {
    renderComAuth({ ...contextoBase, autenticado: false });

    expect(screen.getByText("Tela de login")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });
});
