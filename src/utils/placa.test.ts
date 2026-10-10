import { describe, expect, it } from "vitest";
import { formatarPlaca, limparPlaca, padraoDaPlaca, placaValida } from "./placa";

describe("placa", () => {
  it("limpa o texto digitado: maiúsculas, sem símbolos e no máximo 7 caracteres", () => {
    expect(limparPlaca("abc-1d23")).toBe("ABC1D23");
    expect(limparPlaca(" fjb 4e12 ")).toBe("FJB4E12");
    expect(limparPlaca("abc12345678")).toBe("ABC1234");
  });

  it("diferencia o padrão Mercosul do antigo", () => {
    expect(padraoDaPlaca("FJB4E12")).toBe("mercosul");
    expect(padraoDaPlaca("fjb-4e12")).toBe("mercosul");
    expect(padraoDaPlaca("CMG3164")).toBe("antiga");
    expect(padraoDaPlaca("cmg-3164")).toBe("antiga");
  });

  it("recusa o que não é uma placa completa", () => {
    for (const texto of ["", "ABC", "1234567", "ABCDEFG", "ABCD123", "AB1C2D3", "meu carro"]) {
      expect(placaValida(texto)).toBe(false);
    }
  });

  it("mostra a placa antiga com hífen e a Mercosul sem", () => {
    expect(formatarPlaca("CMG3164")).toBe("CMG-3164");
    expect(formatarPlaca("FJB4E12")).toBe("FJB4E12");
  });
});
