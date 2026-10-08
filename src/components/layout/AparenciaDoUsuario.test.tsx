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

  describe("estilo Pista", () => {
    const pessoaSemEscolha: Usuario = { ...escuroRoxo, perfil: "pessoa", tema: null, cor: null };

    beforeEach(() => {
      delete document.documentElement.dataset.estilo;
    });

    it("perfis pessoa e frota usam o estilo Pista, com laranja de padrão", () => {
      montar("/", pessoaSemEscolha);

      expect(document.documentElement.dataset.estilo).toBe("pista");
      expect(document.documentElement.dataset.cor).toBe("orange");
    });

    it("quem já escolheu uma cor na conta mantém a cor, e o estilo continua", () => {
      montar("/", { ...pessoaSemEscolha, perfil: "frota", tema: "claro", cor: "green" });

      expect(document.documentElement.dataset.estilo).toBe("pista");
      expect(document.documentElement.dataset.cor).toBe("green");
    });

    it("quem escolheu uma cor neste navegador mantém a escolha", () => {
      localStorage.setItem("mycar_cor", "purple");

      montar("/", pessoaSemEscolha);

      expect(document.documentElement.dataset.estilo).toBe("pista");
      expect(document.documentElement.dataset.cor).toBe("purple");
    });

    it("a oficina não recebe o estilo e continua azul", () => {
      montar("/", { ...escuroRoxo, perfil: "oficina", tema: null, cor: null });

      expect(document.documentElement.dataset.estilo).toBeUndefined();
      expect(document.documentElement.dataset.cor).toBe("blue");
    });

    it("o login não recebe o estilo, mesmo com usuário de conta logado", () => {
      document.documentElement.dataset.estilo = "pista";

      montar("/login", pessoaSemEscolha);

      expect(document.documentElement.dataset.estilo).toBeUndefined();
      expect(document.documentElement.dataset.cor).toBe("blue");
    });
  });
});
