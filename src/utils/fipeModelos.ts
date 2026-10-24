import type { FipeItem } from "../services/fipe";

/** Primeiras palavras que só fazem sentido junto com a seguinte ("Grand Siena", "Santa Fe"). */
const PALAVRAS_COMPOSTAS = new Set(["grand", "santa", "space", "great", "land", "range", "new", "novo", "cross", "super"]);

/**
 * A FIPE traz modelo e versão num texto só ("Gol 1.0 Mi Total Flex 8V 4p").
 * Isto devolve a parte do modelo ("Gol"), para a pessoa escolher o modelo e só
 * depois a versão.
 */
export function modeloDaFipe(nome: string): string {
  const palavras = nome.trim().split(/\s+/).filter(Boolean);

  if (palavras.length === 0) {
    return "";
  }

  const [primeira, segunda] = palavras;

  if (segunda && PALAVRAS_COMPOSTAS.has(primeira.toLowerCase()) && !/\d/.test(segunda)) {
    return `${primeira} ${segunda}`;
  }

  return primeira;
}

/** A versão é o que sobra do nome da FIPE depois do modelo; sem sobra, o nome inteiro. */
export function versaoDaFipe(nome: string): string {
  const modelo = modeloDaFipe(nome);
  const resto = nome.trim().slice(modelo.length).trim();

  return resto === "" ? nome.trim() : resto;
}

/** Modelos distintos de uma marca, em ordem alfabética. */
export function modelosDistintos(itens: FipeItem[]): string[] {
  const nomes = new Set(itens.map((item) => modeloDaFipe(item.nome)).filter(Boolean));

  return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
}

/** Versões da FIPE de um modelo, com o texto da versão como rótulo. */
export function versoesDoModelo(itens: FipeItem[], modelo: string): FipeItem[] {
  return itens
    .filter((item) => modeloDaFipe(item.nome) === modelo)
    .map((item) => ({ codigo: item.codigo, nome: versaoDaFipe(item.nome) }));
}
