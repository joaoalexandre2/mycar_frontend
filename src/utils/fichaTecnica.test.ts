import { describe, expect, it } from "vitest";
import { linksDaFicha } from "./fichaTecnica";

describe("linksDaFicha", () => {
  it("monta as buscas com marca, três primeiras palavras do modelo e ano", () => {
    const links = linksDaFicha({
      marca: "GM - Chevrolet",
      modelo: "Onix Hatch LT 1.0 12V Flex 5p Mec.",
      ano: 2020,
    });

    expect(decodeURIComponent(links.fichaCompleta)).toContain(
      "ficha técnica GM - Chevrolet Onix Hatch LT 2020",
    );
    expect(decodeURIComponent(links.manual)).toContain("manual do proprietário");
    expect(links.inmetro).toContain("gov.br/inmetro");
  });
});
