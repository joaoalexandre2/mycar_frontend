import { describe, expect, it } from "vitest";
import { nomeDoPlano } from "./plano";

describe("nomeDoPlano", () => {
  it("traduz a chave do plano para o nome mostrado", () => {
    expect(nomeDoPlano("basico")).toBe("Básico");
    expect(nomeDoPlano("empresarial")).toBe("Empresarial");
  });

  it("sem plano definido, a conta não tem limite", () => {
    expect(nomeDoPlano(null)).toBe("sem limite");
  });
});
