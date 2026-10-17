import type { CodigoDoCatalogo, PecaCatalogo, VeiculoConta } from "../types/conta";

/** "2008–2012", "a partir de 2013", "até 2012" ou "todos os anos". */
export function descreverAnos(de: number | null, ate: number | null): string {
  if (de !== null && ate !== null) {
    return de === ate ? String(de) : `${de}–${ate}`;
  }

  if (de !== null) return `a partir de ${de}`;
  if (ate !== null) return `até ${ate}`;

  return "todos os anos";
}

/** Linha de detalhe do código: anos, motor e observação, sem partes vazias. */
export function detalhesDoCodigo(
  c: Pick<CodigoDoCatalogo, "anoDe" | "anoAte" | "motor" | "observacao">,
): string {
  return [
    descreverAnos(c.anoDe, c.anoAte),
    c.motor ? `motor ${c.motor}` : null,
    c.observacao,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Busca pronta para achar o código certo da peça, já com o veículo e o ano.
 * O código exato muda por ano, motor e versão: por isso vai para a busca, não
 * para um valor guardado por nós.
 */
export function linksDeBusca(
  peca: Pick<PecaCatalogo, "nome" | "posicao">,
  veiculo: Pick<VeiculoConta, "marca" | "modelo" | "ano">,
  modeloCatalogo?: string,
) {
  const nomeVeiculo =
    modeloCatalogo ??
    `${veiculo.marca} ${veiculo.modelo.split(" ").slice(0, 3).join(" ")}`;

  const consulta = `${peca.nome} ${peca.posicao ?? ""} ${nomeVeiculo} ${veiculo.ano}`
    .replace(/\s+/g, " ")
    .trim();

  return {
    google: `https://www.google.com/search?q=${encodeURIComponent(`código ${consulta}`)}`,
    mercadoLivre: `https://lista.mercadolivre.com.br/${encodeURIComponent(
      consulta.toLowerCase().replace(/\s+/g, "-"),
    )}`,
  };
}
