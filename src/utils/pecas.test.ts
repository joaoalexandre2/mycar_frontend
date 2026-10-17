import { describe, expect, it } from "vitest";
import { descreverAnos, detalhesDoCodigo, linksDeBusca } from "./pecas";

describe("linksDeBusca", () => {
  const veiculo = { marca: "GM - Chevrolet", modelo: "Onix Hatch LT 1.0 12V Flex 5p Mec.", ano: 2020 };

  it("usa o modelo do catálogo quando existe", () => {
    const { google, mercadoLivre } = linksDeBusca(
      { nome: "Amortecedor dianteiro", posicao: "dianteiro" },
      veiculo,
      "Chevrolet Onix",
    );

    expect(decodeURIComponent(google)).toContain("código Amortecedor dianteiro dianteiro Chevrolet Onix 2020");
    expect(mercadoLivre).toBe(
      "https://lista.mercadolivre.com.br/amortecedor-dianteiro-dianteiro-chevrolet-onix-2020",
    );
  });

  it("sem modelo no catálogo, usa a marca e as 3 primeiras palavras do modelo", () => {
    const { google } = linksDeBusca({ nome: "Bateria", posicao: null }, veiculo);

    expect(decodeURIComponent(google)).toContain("código Bateria GM - Chevrolet Onix Hatch LT 2020");
  });
});

describe("descreverAnos", () => {
  it("escreve o intervalo, o início aberto, o fim aberto e o sem limite", () => {
    expect(descreverAnos(2008, 2012)).toBe("2008–2012");
    expect(descreverAnos(2010, 2010)).toBe("2010");
    expect(descreverAnos(2013, null)).toBe("a partir de 2013");
    expect(descreverAnos(null, 2012)).toBe("até 2012");
    expect(descreverAnos(null, null)).toBe("todos os anos");
  });
});

describe("detalhesDoCodigo", () => {
  it("junta anos, motor e observação, sem partes vazias", () => {
    expect(detalhesDoCodigo({ anoDe: 2008, anoAte: 2012, motor: "1.0", observacao: "par" })).toBe("2008–2012 · motor 1.0 · par");
    expect(detalhesDoCodigo({ anoDe: null, anoAte: null, motor: null, observacao: null })).toBe("todos os anos");
  });
});
