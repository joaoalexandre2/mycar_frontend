import { describe, expect, it } from "vitest";
import { extrairKm, paraPixelsDaImagem } from "./ocrHodometro";

describe("paraPixelsDaImagem", () => {
  it("converte a seleção da tela para a escala da foto original", () => {
    const area = paraPixelsDaImagem({ x: 10, y: 20, largura: 100, altura: 50 }, { largura: 200, altura: 100 }, { largura: 4000, altura: 2000 });

    expect(area).toEqual({ x: 200, y: 400, largura: 2000, altura: 1000 });
  });

  it("não sai dos limites da foto", () => {
    const area = paraPixelsDaImagem({ x: 150, y: 90, largura: 500, altura: 500 }, { largura: 200, altura: 100 }, { largura: 200, altura: 100 });

    expect(area).toEqual({ x: 150, y: 90, largura: 50, altura: 10 });
  });

  it("nunca devolve área vazia", () => {
    const area = paraPixelsDaImagem({ x: 5, y: 5, largura: 0, altura: 0 }, { largura: 200, altura: 100 }, { largura: 200, altura: 100 });

    expect(area.largura).toBeGreaterThanOrEqual(1);
    expect(area.altura).toBeGreaterThanOrEqual(1);
  });
});

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
