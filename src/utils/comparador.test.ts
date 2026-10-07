import { describe, expect, it } from "vitest";
import {
  linksOutrasLojas,
  montarConsulta,
  nomeParaBusca,
  normalizarMedidaPneu,
} from "./comparador";

const onix = { marca: "GM - Chevrolet", modelo: "Onix Hatch LT 1.0 12V Flex 5p Mec.", ano: 2020 };

describe("comparador", () => {
  it("normaliza a medida do pneu em vários formatos", () => {
    expect(normalizarMedidaPneu("185/65 R15")).toBe("185/65 R15");
    expect(normalizarMedidaPneu("185/65r15")).toBe("185/65 R15");
    expect(normalizarMedidaPneu("205 55 16")).toBe("205/55 R16");
    expect(normalizarMedidaPneu("225/45ZR17")).toBe("225/45 R17");
    expect(normalizarMedidaPneu("pneu bom")).toBe("");
    expect(normalizarMedidaPneu(null)).toBe("");
  });

  it("monta o nome do veículo sem o prefixo da marca", () => {
    expect(nomeParaBusca(onix)).toBe("Chevrolet Onix Hatch 2020");
  });

  it("pneu usa só a medida; as outras peças usam o veículo", () => {
    expect(montarConsulta({ texto: "pneu", veiculo: onix, medidaPneu: "185/65 R15" })).toBe("pneu 185/65 R15");
    expect(montarConsulta({ texto: "filtro de óleo", veiculo: onix })).toBe("filtro de óleo Chevrolet Onix Hatch 2020");
    expect(montarConsulta({ texto: "  bateria 60ah ", veiculo: null })).toBe("bateria 60ah");
  });

  it("gera links de busca em outras lojas com a consulta codificada", () => {
    const links = linksOutrasLojas("pneu 185/65 R15");

    expect(links.map((l) => l.loja)).toEqual(["Google Shopping", "Zoom", "Buscapé"]);
    expect(links[0].url).toContain(encodeURIComponent("pneu 185/65 R15"));
  });
});
