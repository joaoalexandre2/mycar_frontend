import { describe, expect, it } from "vitest";
import { avisoDeAnoDaFicha, linksDaFicha } from "./fichaTecnica";

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

describe("avisoDeAnoDaFicha", () => {
  const versao = "Ford Fiesta SE 1.6 16V 2019";

  it("anos iguais ou desconhecidos: nenhum aviso", () => {
    expect(avisoDeAnoDaFicha(2019, 2019, versao)).toBeNull();
    expect(avisoDeAnoDaFicha(null, 2012, versao)).toBeNull();
    expect(avisoDeAnoDaFicha(2019, undefined, versao)).toBeNull();
    expect(avisoDeAnoDaFicha(Number.NaN, 2012, versao)).toBeNull();
  });

  it("um ano de diferença: aviso leve com os dois anos", () => {
    const aviso = avisoDeAnoDaFicha(2019, 2018, versao);

    expect(aviso?.nivel).toBe("leve");
    expect(aviso?.texto).toContain("Ford Fiesta SE 1.6 16V 2019");
    expect(aviso?.texto).toContain("2018");
    expect(aviso?.texto).toContain("um ano de diferença");
  });

  it("dois anos ou mais: aviso forte que cita potência e consumo", () => {
    const aviso = avisoDeAnoDaFicha(2019, 2012, versao);

    expect(aviso?.nivel).toBe("forte");
    expect(aviso?.texto).toContain("Esta ficha é de Ford Fiesta SE 1.6 16V 2019");
    expect(aviso?.texto).toContain("o seu veículo é de 2012");
    expect(aviso?.texto).toContain("potência e consumo");
  });

  it("vale também quando o veículo é mais novo que a ficha de referência", () => {
    expect(avisoDeAnoDaFicha(2010, 2020, "Fiat Uno 2010")?.nivel).toBe("forte");
  });
});
