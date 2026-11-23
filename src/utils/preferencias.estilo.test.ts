import { beforeEach, describe, expect, it } from "vitest";
import {
  aplicarAparenciaSalva,
  aplicarEstilo,
  corSalva,
  estiloDoPerfil,
} from "./preferencias";
import type { Usuario } from "../types/auth";

const base: Usuario = { id: 1, name: "Ana", email: "ana@x.com" };

describe("estilo do app", () => {
  beforeEach(() => {
    localStorage.clear();
    aplicarEstilo(null);
    delete document.documentElement.dataset.cor;
    document.documentElement.classList.remove("dark");
  });

  it("todos os perfis usam o mesmo visual (MyCar)", () => {
    expect(estiloDoPerfil({ ...base, perfil: "pessoa" })).toBe("mycar");
    expect(estiloDoPerfil({ ...base, perfil: "frota" })).toBe("mycar");
    expect(estiloDoPerfil({ ...base, perfil: "oficina" })).toBe("mycar");
  });

  it("sessão antiga (sem perfil) também; sem usuário, sem estilo", () => {
    expect(estiloDoPerfil(base)).toBe("mycar");
    expect(estiloDoPerfil(null)).toBeNull();
    expect(estiloDoPerfil(undefined)).toBeNull();
  });

  it("a cor padrão é a da marca (\"blue\") para todos os perfis", () => {
    aplicarAparenciaSalva("mycar");
    expect(document.documentElement.dataset.cor).toBe("blue");
    expect(document.documentElement.dataset.estilo).toBe("mycar");

    aplicarAparenciaSalva();
    expect(document.documentElement.dataset.cor).toBe("blue");
    expect(document.documentElement.dataset.estilo).toBeUndefined();
  });

  it("a cor escolhida continua valendo", () => {
    localStorage.setItem("mycar_cor", "green");

    aplicarAparenciaSalva("mycar");

    expect(corSalva()).toBe("green");
    expect(document.documentElement.dataset.cor).toBe("green");
  });

  it("a cor vermelha é aceita e aplicada", () => {
    localStorage.setItem("mycar_cor", "red");

    aplicarAparenciaSalva("mycar");

    expect(corSalva()).toBe("red");
    expect(document.documentElement.dataset.cor).toBe("red");
  });

  it("valor inválido guardado não vira cor", () => {
    localStorage.setItem("mycar_cor", "rosa");

    expect(corSalva()).toBeNull();
  });

  describe("compatibilidade com o nome antigo do estilo", () => {
    it("a raiz com um valor antigo de data-estilo passa a ter o novo", () => {
      // O nome anterior só existia na raiz da página (nunca foi gravado no
      // navegador nem na conta); qualquer valor que esteja lá é substituído.
      document.documentElement.dataset.estilo = "nome-antigo";

      aplicarAparenciaSalva(estiloDoPerfil(base));

      expect(document.documentElement.dataset.estilo).toBe("mycar");
    });

    it("quem salvou a cor padrão (\"blue\") antes da troca continua com ela", () => {
      localStorage.setItem("mycar_tema", "escuro");
      localStorage.setItem("mycar_cor", "blue");

      aplicarAparenciaSalva(estiloDoPerfil(base));

      expect(corSalva()).toBe("blue");
      expect(localStorage.getItem("mycar_cor")).toBe("blue");
      expect(document.documentElement.dataset.cor).toBe("blue");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });
});
