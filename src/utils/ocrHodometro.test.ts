import { describe, expect, it } from "vitest";
import { extrairKm } from "./ocrHodometro";

describe("extrairKm", () => {
  it("acha o km no meio de um texto com outros números", () => {
    expect(extrairKm("TRIP 12.4\nODO 45230\nkm")).toBe(45230);
  });

  it("aceita ponto ou espaço de milhar", () => {
    expect(extrairKm("45.230 km")).toBe(45230);
    expect(extrairKm("45 230")).toBe(45230);
  });

  it("fica com o maior número quando há mais de um", () => {
    expect(extrairKm("123 45230 9876")).toBe(45230);
  });

  it("devolve null quando não há número plausível", () => {
    expect(extrairKm("")).toBeNull();
    expect(extrairKm("ab cd 12")).toBeNull();
  });

  it("ignora números acima do máximo de um hodômetro", () => {
    expect(extrairKm("99999999")).toBeNull();
  });
});
