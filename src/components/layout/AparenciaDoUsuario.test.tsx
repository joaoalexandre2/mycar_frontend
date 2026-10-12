import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../contexts/authContextDefinition";
import type { Usuario } from "../../types/auth";
import { AparenciaDoUsuario } from "./AparenciaDoUsuario";

function montar(rota: string, usuario: Usuario | null) {
  return render(
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: Boolean(usuario),
        entrar: vi.fn(),
        sair: vi.fn(),
        atualizarUsuario: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[rota]}>
        <AparenciaDoUsuario />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

const escuroRoxo: Usuario = {
  id: 1,
  name: "Ana",
  email: "ana@x.com",
  tema: "escuro",
  cor: "purple",
};

describe("AparenciaDoUsuario", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    delete document.documentElement.dataset.cor;
  });

  it("aplica o tema e a cor gravados na conta", () => {
    montar("/", escuroRoxo);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.cor).toBe("purple");
  });

  it("o login fica sempre no visual padrão, mesmo com usuário escuro", () => {
    montar("/login", escuroRoxo);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.cor).toBe("blue");
  });

  it("sem usuário logado, fica no visual padrão", () => {
    montar("/", null);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.dataset.cor).toBe("blue");
  });

  it("sem escolha na conta, vale o que está salvo no navegador", () => {
    localStorage.setItem("mycar_tema", "escuro");
    localStorage.setItem("mycar_cor", "green");

    montar("/", { ...escuroRoxo, tema: null, cor: null });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.cor).toBe("green");
  });

  describe("estilo do app", () => {
    const semEscolha: Usuario = { ...escuroRoxo, perfil: "pessoa", tema: null, cor: null };

    beforeEach(() => {
      delete document.documentElement.dataset.estilo;
    });

    it("todos os perfis recebem o mesmo estilo e a cor padrão da marca", () => {
      for (const perfil of ["pessoa", "frota", "oficina"] as const) {
        delete document.documentElement.dataset.estilo;
        delete document.documentElement.dataset.cor;

        const { unmount } = montar("/", { ...semEscolha, perfil });

        expect(document.documentElement.dataset.estilo).toBe("webmotors");
        expect(document.documentElement.dataset.cor).toBe("blue");

        unmount();
      }
    });

    it("quem já escolheu uma cor na conta mantém a cor, e o estilo continua", () => {
      montar("/", { ...semEscolha, perfil: "frota", tema: "claro", cor: "green" });

      expect(document.documentElement.dataset.estilo).toBe("webmotors");
      expect(document.documentElement.dataset.cor).toBe("green");
    });

    it("quem escolheu uma cor neste navegador mantém a escolha", () => {
      localStorage.setItem("mycar_cor", "purple");

      montar("/", semEscolha);

      expect(document.documentElement.dataset.estilo).toBe("webmotors");
      expect(document.documentElement.dataset.cor).toBe("purple");
    });

    it("sessão antiga, sem perfil, recebe o mesmo estilo", () => {
      const { perfil, ...semPerfil } = { ...semEscolha };
      void perfil;

      montar("/", semPerfil);

      expect(document.documentElement.dataset.estilo).toBe("webmotors");
    });

    it("o login não recebe o atributo de estilo, mesmo com usuário logado", () => {
      document.documentElement.dataset.estilo = "webmotors";

      montar("/login", semEscolha);

      expect(document.documentElement.dataset.estilo).toBeUndefined();
      expect(document.documentElement.dataset.cor).toBe("blue");
    });
  });
});
