import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { MenuRoute } from "./MenuRoute";

function renderizar(menus: string[] | null) {
  const valor = {
    usuario: { id: 1, name: "Bia", email: "bia@x.com", perfil: "frota", papel: "motorista", menus },
    autenticado: true,
  } as unknown as AuthContextValor;

  return render(
    <AuthContext.Provider value={valor}>
      <MemoryRouter initialEntries={["/agenda"]}>
        <Routes>
          <Route path="/" element={<p>Início</p>} />
          <Route element={<MenuRoute menu="agenda" />}>
            <Route path="/agenda" element={<p>Tela da agenda</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("MenuRoute", () => {
  it("manda para o início quem não vê o menu, mesmo pela URL", () => {
    renderizar([]);

    expect(screen.getByText("Início")).toBeInTheDocument();
    expect(screen.queryByText("Tela da agenda")).not.toBeInTheDocument();
  });

  it("abre a tela quando o menu está liberado", () => {
    renderizar(["agenda"]);

    expect(screen.getByText("Tela da agenda")).toBeInTheDocument();
  });
});
