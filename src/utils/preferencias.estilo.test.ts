import { beforeEach, describe, expect, it } from "vitest";
import {
  aplicarAparenciaSalva,
  aplicarEstilo,
  corSalva,
  estiloDoPerfil,
} from "./preferencias";
import type { Usuario } from "../types/auth";

const base: Usuario = { id: 1, name: "Ana", email: "ana@x.com" };

describe("estilo por perfil", () => {
  beforeEach(() => {
    localStorage.clear();
    aplicarEstilo(null);
    delete document.documentElement.dataset.cor;
    document.documentElement.classList.remove("dark");
  });

  it("pessoa e frota usam o estilo Pista; oficina usa o estilo Oficina", () => {
    expect(estiloDoPerfil({ ...base, perfil: "pessoa" })).toBe("pista");
    expect(estiloDoPerfil({ ...base, perfil: "frota" })).toBe("pista");
    expect(estiloDoPerfil({ ...base, perfil: "oficina" })).toBe("oficina");
  });

  it("sessão antiga (sem perfil) é de oficina; sem usuário, sem estilo", () => {
    expect(estiloDoPerfil(base)).toBe("oficina");
    expect(estiloDoPerfil(null)).toBeNull();
    expect(estiloDoPerfil(undefined)).toBeNull();
  });

  it("o laranja é o padrão só do estilo Pista", () => {
    aplicarAparenciaSalva("pista");
    expect(document.documentElement.dataset.cor).toBe("orange");

    aplicarAparenciaSalva("oficina");
    expect(document.documentElement.dataset.cor).toBe("blue");

    aplicarAparenciaSalva();
    expect(document.documentElement.dataset.cor).toBe("blue");
    expect(document.documentElement.dataset.estilo).toBeUndefined();
  });

  it("a cor escolhida vale em qualquer estilo", () => {
    localStorage.setItem("mycar_cor", "green");

    aplicarAparenciaSalva("pista");

    expect(corSalva()).toBe("green");
    expect(document.documentElement.dataset.cor).toBe("green");
  });

it("a cor vermelha é aceita e aplicada", () => {    localStorage.setItem("mycar_cor", "red");    aplicarAparenciaSalva("oficina");    expect(corSalva()).toBe("red");    expect(document.documentElement.dataset.cor).toBe("red");  });
  it("valor inválido guardado não vira cor", () => {
    localStorage.setItem("mycar_cor", "rosa");

    expect(corSalva()).toBeNull();
  });
});
