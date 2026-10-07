import type { FichaTecnicaConta } from "../types/conta";

/** Página oficial do Inmetro com as tabelas de consumo (PBE Veicular). */
const INMETRO_PBE =
  "https://www.gov.br/inmetro/pt-br/assuntos/avaliacao-da-conformidade/programa-brasileiro-de-etiquetagem/tabelas-de-eficiencia-energetica/veiculos-automotivos-pbe-veicular";

/** Buscas prontas com o veículo e o ano, para achar o que não temos guardado. */
export function linksDaFicha(
  veiculo: Pick<FichaTecnicaConta["veiculo"], "marca" | "modelo" | "ano">,
) {
  const nome = `${veiculo.marca} ${veiculo.modelo.split(" ").slice(0, 3).join(" ")} ${veiculo.ano}`;
  const buscar = (consulta: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(consulta)}`;

  return {
    fichaCompleta: buscar(`ficha técnica ${nome}`),
    manual: buscar(`manual do proprietário ${nome} pdf`),
    inmetro: INMETRO_PBE,
  };
}
