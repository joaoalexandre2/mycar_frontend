import { describe, expect, it } from "vitest";
import { ehConta, ehPerfil, ORDEM_PERFIS, perfilDe, PERFIS } from "./perfil";

describe("perfil", () => {
  it("sessões antigas, sem perfil, são de oficina", () => {
    expect(perfilDe(null)).toBe("oficina");
    expect(perfilDe(undefined)).toBe("oficina");
    expect(perfilDe({ id: 1, name: "A", email: "a@a.com" })).toBe("oficina");
  });

  it("devolve o perfil informado pelo backend", () => {
    expect(perfilDe({ id: 1, name: "A", email: "a@a.com", perfil: "pessoa" })).toBe("pessoa");
    expect(perfilDe({ id: 1, name: "A", email: "a@a.com", perfil: "frota" })).toBe("frota");
  });

  it("pessoa e frota são contas; oficina não", () => {
    expect(ehConta("pessoa")).toBe(true);
    expect(ehConta("frota")).toBe(true);
    expect(ehConta("oficina")).toBe(false);
  });

  it("só aceita os três perfis conhecidos (links como /registrar?perfil=x)", () => {
    expect(ehPerfil("oficina")).toBe(true);
    expect(ehPerfil("pessoa")).toBe(true);
    expect(ehPerfil("frota")).toBe(true);
    expect(ehPerfil("admin")).toBe(false);
    expect(ehPerfil(null)).toBe(false);
  });

  it("todo perfil listado no cadastro tem nome de produto e descrição", () => {
    expect(ORDEM_PERFIS).toHaveLength(3);

    for (const perfil of ORDEM_PERFIS) {
      expect(PERFIS[perfil].produto).toMatch(/^MyCar /);
      expect(PERFIS[perfil].descricao.length).toBeGreaterThan(10);
    }
  });
});
