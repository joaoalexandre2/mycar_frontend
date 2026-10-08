import { describe, expect, it } from "vitest";
import { diasAteData } from "./prazos";

describe("diasAteData", () => {
  const hoje = new Date(2026, 9, 7, 15, 30); // 7/out/2026, à tarde

  it("conta os dias a partir do início de hoje, ignorando a hora", () => {
    expect(diasAteData("2026-10-07", hoje)).toBe(0);
    expect(diasAteData("2026-10-08", hoje)).toBe(1);
    expect(diasAteData("2026-10-30", hoje)).toBe(23);
  });

  it("data que já passou vem negativa", () => {
    expect(diasAteData("2026-10-01", hoje)).toBe(-6);
  });

  it("atravessa a virada de mês e de ano", () => {
    expect(diasAteData("2027-01-01", hoje)).toBe(86);
  });

  it("aceita data com hora (ISO completo)", () => {
    expect(diasAteData("2026-10-10T12:00:00-03:00", hoje)).toBe(3);
  });
});
