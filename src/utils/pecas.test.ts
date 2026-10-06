import { describe, expect, it } from "vitest";
import { linksDeBusca } from "./pecas";

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
