import { describe, expect, it } from "vitest";
import { modeloDaFipe, modelosDistintos, versaoDaFipe, versoesDoModelo } from "./fipeModelos";

describe("modeloDaFipe e versaoDaFipe", () => {
  it.each([
    ["Gol 1.0 Mi Total Flex 8V 4p", "Gol", "1.0 Mi Total Flex 8V 4p"],
    ["Corolla XEi 2.0 Flex 16V Aut.", "Corolla", "XEi 2.0 Flex 16V Aut."],
    ["Palio Weekend Adv. 1.8 mpi Flex", "Palio", "Weekend Adv. 1.8 mpi Flex"],
    ["Grand Siena ESSENCE 1.6 Flex", "Grand Siena", "ESSENCE 1.6 Flex"],
    ["Santa Fe GLS 3.5 V6 Aut.", "Santa Fe", "GLS 3.5 V6 Aut."],
    ["Novo Uno Way 1.0 Flex", "Novo Uno", "Way 1.0 Flex"],
  ])("%s → modelo %s", (nome, modelo, versao) => {
    expect(modeloDaFipe(nome)).toBe(modelo);
    expect(versaoDaFipe(nome)).toBe(versao);
  });

  it("palavra composta seguida de número não vira modelo de duas palavras", () => {
    expect(modeloDaFipe("New 1.0 Flex")).toBe("New");
  });

  it("nome com uma palavra só: a versão é o nome inteiro", () => {
    expect(modeloDaFipe("Uno")).toBe("Uno");
    expect(versaoDaFipe("Uno")).toBe("Uno");
  });

  it("tolera espaços sobrando e texto vazio", () => {
    expect(modeloDaFipe("  Gol   1.0 ")).toBe("Gol");
    expect(modeloDaFipe("")).toBe("");
  });
});

describe("modelosDistintos e versoesDoModelo", () => {
  const itens = [
    { codigo: "1", nome: "Gol 1.6 Flex" },
    { codigo: "2", nome: "Fox 1.0 Flex" },
    { codigo: "3", nome: "Gol 1.0 Flex" },
  ];

  it("lista cada modelo uma vez, em ordem alfabética", () => {
    expect(modelosDistintos(itens)).toEqual(["Fox", "Gol"]);
  });

  it("devolve as versões do modelo com o código da FIPE", () => {
    expect(versoesDoModelo(itens, "Gol")).toEqual([
      { codigo: "1", nome: "1.6 Flex" },
      { codigo: "3", nome: "1.0 Flex" },
    ]);
    expect(versoesDoModelo(itens, "Inexistente")).toEqual([]);
  });
});
