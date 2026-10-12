import { describe, expect, it } from "vitest";
import { lerInteiroBR, lerNumeroBR } from "./numero";

function valorDe(texto: string, opcoes?: { pontoComoMilhar?: boolean }) {
  const lido = lerNumeroBR(texto, opcoes);

  return lido.estado === "ok" ? lido.valor : lido.estado;
}

describe("lerNumeroBR", () => {
  it.each([
    ["2.500", 2500],
    ["2.500,00", 2500],
    ["1.234,56", 1234.56],
    ["10.500,90", 10500.9],
    ["1.234.567", 1234567],
    ["1234,56", 1234.56],
    ["1234.56", 1234.56],
    ["52,5", 52.5],
    ["230", 230],
    ["0,5", 0.5],
    ["0", 0],
  ])("lê %s como %s", (texto, esperado) => {
    expect(valorDe(texto)).toBe(esperado);
  });

  it("ponto que não forma milhar é decimal", () => {
    expect(valorDe("2.5")).toBe(2.5);
    expect(valorDe("12.34")).toBe(12.34);
    expect(valorDe("38.5")).toBe(38.5);
    // zero à esquerda: é decimal, não 500.
    expect(valorDe("0.500")).toBe(0.5);
  });

  it("aceita o formato americano quando os dois separadores aparecem", () => {
    expect(valorDe("1,234.56")).toBe(1234.56);
  });

  it("tira R$ e espaços", () => {
    expect(valorDe("R$ 1.234,56")).toBe(1234.56);
    expect(valorDe(" 230,00 ")).toBe(230);
  });

  it("vazio e só espaços são vazio, não inválido", () => {
    expect(valorDe("")).toBe("vazio");
    expect(valorDe("   ")).toBe("vazio");
  });

  it.each(["abc", "12a", "1,2,3", "1.2.3,4,5", "--5", "-5", "1e3", ",", ".", "R$"])(
    "%s é inválido (e nunca vira NaN)",
    (texto) => {
      const lido = lerNumeroBR(texto);

      expect(lido.estado === "invalido" || lido.estado === "vazio").toBe(true);

      if (lido.estado === "ok") {
        expect(Number.isNaN(lido.valor)).toBe(false);
      }
    },
  );

  it("não trata ponto como milhar quando o campo pede casas decimais", () => {
    expect(valorDe("38.500", { pontoComoMilhar: false })).toBe(38.5);
    expect(valorDe("4.5", { pontoComoMilhar: false })).toBe(4.5);
    // a vírgula continua sendo decimal
    expect(valorDe("38,5", { pontoComoMilhar: false })).toBe(38.5);
  });
});

describe("lerInteiroBR", () => {
  it("aceita milhar com ponto", () => {
    const lido = lerInteiroBR("52.300");

    expect(lido).toEqual({ estado: "ok", valor: 52300 });
  });

  it("rejeita decimal em vez de juntar os dígitos", () => {
    expect(lerInteiroBR("52,5")).toEqual({ estado: "invalido" });
  });

  it("vazio continua vazio", () => {
    expect(lerInteiroBR("")).toEqual({ estado: "vazio" });
  });
});
