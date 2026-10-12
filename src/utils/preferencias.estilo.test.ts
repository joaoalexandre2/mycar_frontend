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

  it("todos os perfis usam o mesmo visual (Webmotors)", () => {
    expect(estiloDoPerfil({ ...base, perfil: "pessoa" })).toBe("webmotors");
    expect(estiloDoPerfil({ ...base, perfil: "frota" })).toBe("webmotors");
    expect(estiloDoPerfil({ ...base, perfil: "oficina" })).toBe("webmotors");
  });

  it("sessão antiga (sem perfil) também; sem usuário, sem estilo", () => {
    expect(estiloDoPerfil(base)).toBe("webmotors");
    expect(estiloDoPerfil(null)).toBeNull();
    expect(estiloDoPerfil(undefined)).toBeNull();
  });

  it("a cor padrão é a da marca (\"blue\") para todos os perfis", () => {
    aplicarAparenciaSalva("webmotors");
    expect(document.documentElement.dataset.cor).toBe("blue");
    expect(document.documentElement.dataset.estilo).toBe("webmotors");

    aplicarAparenciaSalva();
    expect(document.documentElement.dataset.cor).toBe("blue");
    expect(document.documentElement.dataset.estilo).toBeUndefined();
  });

  it("a cor escolhida continua valendo", () => {
    localStorage.setItem("mycar_cor", "green");

    aplicarAparenciaSalva("webmotors");

    expect(corSalva()).toBe("green");
    expect(document.documentElement.dataset.cor).toBe("green");
  });

  it("a cor vermelha é aceita e aplicada", () => {
    localStorage.setItem("mycar_cor", "red");

    aplicarAparenciaSalva("webmotors");

    expect(corSalva()).toBe("red");
    expect(document.documentElement.dataset.cor).toBe("red");
  });

  it("valor inválido guardado não vira cor", () => {
    localStorage.setItem("mycar_cor", "rosa");

    expect(corSalva()).toBeNull();
  });
});
