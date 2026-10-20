import type { FichaTecnicaConta } from "../types/conta";

/** Página oficial do Inmetro com as tabelas de consumo (PBE Veicular). */
const INMETRO_PBE =
  "https://www.gov.br/inmetro/pt-br/assuntos/avaliacao-da-conformidade/programa-brasileiro-de-etiquetagem/tabelas-de-eficiencia-energetica/veiculos-automotivos-pbe-veicular";

export interface AvisoDeAno {
  /** leve: 1 ano de diferença; forte: 2 anos ou mais (geração ou motor podem ter mudado). */
  nivel: "leve" | "forte";
  texto: string;
}

/**
 * A ficha de referência é a da versão mais recente do modelo, então pode ser de
 * um ano diferente do veículo. Quando for, avisamos com os dois anos em vez de
 * deixar a pessoa achar que são os dados do carro dela. Anos iguais ou
 * desconhecidos: nenhum aviso.
 */
export function avisoDeAnoDaFicha(
  anoDaFicha: number | null | undefined,
  anoDoVeiculo: number | null | undefined,
  versaoDaFicha: string,
): AvisoDeAno | null {
  if (!Number.isFinite(anoDaFicha) || !Number.isFinite(anoDoVeiculo)) return null;

  const diferenca = Math.abs((anoDaFicha as number) - (anoDoVeiculo as number));

  if (diferenca === 0) return null;

  if (diferenca === 1) {
    return {
      nivel: "leve",
      texto: `Esta ficha é de ${versaoDaFicha}; o seu veículo é de ${anoDoVeiculo}, um ano de diferença. Costuma ser parecida, mas confira no manual.`,
    };
  }

  return {
    nivel: "forte",
    texto: `Esta ficha é de ${versaoDaFicha}; o seu veículo é de ${anoDoVeiculo}. Valores como potência e consumo podem ser diferentes, porque o modelo mudou ao longo dos anos. Confira no manual.`,
  };
}

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
