import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { FrotaRoute } from "./FrotaRoute";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import type { Perfil } from "../../types/auth";

function renderComPerfil(perfil: Perfil | undefined) {
  const valor: AuthContextValor = {
    usuario: { id: 1, name: "Ana", email: "ana@mycar.local", perfil },
    autenticado: true,
    entrar: async () => {},
    sair: async () => {},
    atualizarUsuario: () => {},
  };

  return render(
    <AuthContext.Provider value={valor}>
      <MemoryRouter initialEntries={["/agenda"]}>
        <Routes>
          <Route element={<FrotaRoute />}>
            <Route path="/agenda" element={<div>Agenda da frota</div>} />
          </Route>
          <Route path="/" element={<div>Início</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("FrotaRoute", () => {
  it("mostra a agenda para o perfil frota", () => {
    renderComPerfil("frota");

    expect(screen.getByText("Agenda da frota")).toBeInTheDocument();
  });

  it.each<Perfil | undefined>(["pessoa", "oficina", undefined])("leva ao início quem é %s", (perfil) => {
    renderComPerfil(perfil);

    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.queryByText("Agenda da frota")).not.toBeInTheDocument();
  });
});
