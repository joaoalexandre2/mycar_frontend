import type { PecaCatalogo, VeiculoConta } from "../types/conta";

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
