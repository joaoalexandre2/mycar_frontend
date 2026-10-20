import { describe, expect, it } from "vitest";
import { situacaoDaCnh } from "./motorista";

describe("situacaoDaCnh", () => {
  const hoje = new Date(2026, 9, 20, 10, 0); // 20/10/2026

  it("sem validade ou com valor inválido, não há aviso", () => {
    expect(situacaoDaCnh(null, hoje)).toBeNull();
    expect(situacaoDaCnh("", hoje)).toBeNull();
    expect(situacaoDaCnh("20/10/2026", hoje)).toBeNull();
  });

  it("vencida quando a validade já passou", () => {
    expect(situacaoDaCnh("2026-10-19", hoje)).toBe("vencida");
    expect(situacaoDaCnh("2024-01-01", hoje)).toBe("vencida");
  });

  it("o próprio dia do vencimento ainda vale (vence em breve, não vencida)", () => {
    expect(situacaoDaCnh("2026-10-20", hoje)).toBe("vence_em_breve");
  });

  it("vence em breve até 30 dias, e depois está em dia", () => {
    expect(situacaoDaCnh("2026-11-19", hoje)).toBe("vence_em_breve"); // 30 dias
    expect(situacaoDaCnh("2026-11-20", hoje)).toBe("em_dia"); // 31 dias
    expect(situacaoDaCnh("2030-01-01", hoje)).toBe("em_dia");
  });
});
