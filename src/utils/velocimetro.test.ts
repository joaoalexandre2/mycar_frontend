import { describe, expect, it } from "vitest";
import {
  CONSUMO_MAXIMO_KM_L,
  arcoDoSemicirculo,
  fracaoDaEscala,
  marcasDaEscala,
  pontoDoSemicirculo,
} from "./velocimetro";

describe("velocímetro", () => {
  it("converte o consumo em posição na escala de 0 a 20 km/l", () => {
    expect(fracaoDaEscala(0)).toBe(0);
    expect(fracaoDaEscala(10)).toBe(0.5);
    expect(fracaoDaEscala(11.8)).toBeCloseTo(0.59, 2);
    expect(fracaoDaEscala(CONSUMO_MAXIMO_KM_L)).toBe(1);
  });

  it("trava no fim da escala e trata valor ausente como zero", () => {
    expect(fracaoDaEscala(35)).toBe(1);
    expect(fracaoDaEscala(null)).toBe(0);
    expect(fracaoDaEscala(undefined)).toBe(0);
    expect(fracaoDaEscala(-3)).toBe(0);
    expect(fracaoDaEscala(Number.NaN)).toBe(0);
  });

  it("acha os pontos do semicírculo: esquerda, topo e direita", () => {
    const esquerda = pontoDoSemicirculo(100, 100, 80, 0);
    const topo = pontoDoSemicirculo(100, 100, 80, 0.5);
    const direita = pontoDoSemicirculo(100, 100, 80, 1);

    expect(esquerda.x).toBeCloseTo(20);
    expect(esquerda.y).toBeCloseTo(100);
    expect(topo.x).toBeCloseTo(100);
    expect(topo.y).toBeCloseTo(20);
    expect(direita.x).toBeCloseTo(180);
    expect(direita.y).toBeCloseTo(100);
  });

  it("monta o arco do começo da escala até a fração", () => {
    expect(arcoDoSemicirculo(100, 100, 80, 1)).toBe("M 20 100 A 80 80 0 0 1 180 100");
    expect(arcoDoSemicirculo(100, 100, 80, 0.5)).toBe("M 20 100 A 80 80 0 0 1 100 20");
    // Fração fora da escala fica dentro dela.
    expect(arcoDoSemicirculo(100, 100, 80, 7)).toBe(arcoDoSemicirculo(100, 100, 80, 1));
  });

  it("gera as marcas da escala entre dois raios", () => {
    const [primeira, meio] = marcasDaEscala(100, 100, 80, 70, [0, 0.5]);

    expect(primeira).toEqual({ fracao: 0, x1: 20, y1: 100, x2: 30, y2: 100 });
    expect(meio).toEqual({ fracao: 0.5, x1: 100, y1: 20, x2: 100, y2: 30 });
  });
});
