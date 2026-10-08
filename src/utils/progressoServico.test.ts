import { describe, expect, it } from "vitest";
import { limitarFracao, progressoDoServico } from "./progressoServico";

const base = {
  km: 50000,
  kmAtual: 59520,
  intervaloKm: 10000,
  realizadoEm: "2026-03-01",
  proximoEm: "2026-09-01",
};

describe("progressoDoServico", () => {
  it("calcula o quanto do intervalo de km já foi usado", () => {
    const { km } = progressoDoServico(base, "2026-06-01");

    expect(km).toEqual({ usado: 9520, total: 10000, fracao: 0.952 });
  });

  it("calcula o quanto do prazo já passou, em dias", () => {
    const { prazo } = progressoDoServico(base, "2026-06-01");

    // 1/mar a 1/set = 184 dias; 1/mar a 1/jun = 92 dias
    expect(prazo?.total).toBe(184);
    expect(prazo?.usado).toBe(92);
    expect(prazo?.fracao).toBeCloseTo(0.5, 2);
  });

  it("só devolve a barra de km quando há km do serviço, km atual e intervalo", () => {
    expect(progressoDoServico({ ...base, km: null }, "2026-06-01").km).toBeNull();
    expect(progressoDoServico({ ...base, kmAtual: null }, "2026-06-01").km).toBeNull();
    expect(progressoDoServico({ ...base, intervaloKm: null }, "2026-06-01").km).toBeNull();
  });

  it("só devolve a barra de prazo quando há próxima data", () => {
    expect(progressoDoServico({ ...base, proximoEm: null }, "2026-06-01").prazo).toBeNull();
  });

  it("passou do intervalo: a fração fica acima de 1 e a barra desenha 100%", () => {
    const { km, prazo } = progressoDoServico(
      { ...base, kmAtual: 61500 },
      "2026-10-01",
    );

    expect(km?.fracao).toBeCloseTo(1.15, 2);
    expect(prazo?.fracao).toBeGreaterThan(1);
    expect(limitarFracao(km?.fracao ?? 0)).toBe(1);
  });

  it("km atual menor que o do serviço (erro de digitação) não vira número negativo", () => {
    const { km } = progressoDoServico({ ...base, kmAtual: 49000 }, "2026-06-01");

    expect(km?.usado).toBe(0);
    expect(km?.fracao).toBe(0);
  });

  it("serviço feito hoje começa em zero", () => {
    const { prazo } = progressoDoServico({ ...base, realizadoEm: "2026-06-01", proximoEm: "2026-12-01" }, "2026-06-01");

    expect(prazo?.usado).toBe(0);
    expect(prazo?.fracao).toBe(0);
  });

  it("limita a fração entre 0 e 1", () => {
    expect(limitarFracao(-0.2)).toBe(0);
    expect(limitarFracao(0.4)).toBe(0.4);
    expect(limitarFracao(3)).toBe(1);
  });
});
