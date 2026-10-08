import type { Servico } from "../types/conta";

export interface BarraDeProgresso {
  /** Quanto já andou desde o serviço (km ou dias). */
  usado: number;
  /** Quanto vale o intervalo escolhido (km ou dias). */
  total: number;
  /** usado / total, de 0 a 1 (passa de 1 quando já estourou: use limitarFracao para desenhar). */
  fracao: number;
}

export interface ProgressoDoServico {
  km: BarraDeProgresso | null;
  prazo: BarraDeProgresso | null;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function diasEntre(deISO: string, ateISO: string): number {
  const de = new Date(`${deISO.slice(0, 10)}T00:00:00`);
  const ate = new Date(`${ateISO.slice(0, 10)}T00:00:00`);

  return Math.round((ate.getTime() - de.getTime()) / MS_POR_DIA);
}

function barra(usado: number, total: number): BarraDeProgresso | null {
  if (!(total > 0) || Number.isNaN(usado)) {
    return null;
  }

  const u = Math.max(0, usado);

  return { usado: u, total, fracao: u / total };
}

/** A fração desenhada na barra: nunca passa de 100%. */
export function limitarFracao(fracao: number): number {
  return Math.min(Math.max(fracao, 0), 1);
}

/**
 * Quanto do intervalo do serviço já foi consumido, por quilometragem e por prazo.
 * Só devolve cada barra quando há dado suficiente (km do serviço, km atual e
 * intervalo; ou a data do serviço e a próxima data).
 */
export function progressoDoServico(
  servico: Pick<
    Servico,
    "km" | "kmAtual" | "intervaloKm" | "realizadoEm" | "proximoEm"
  >,
  hojeISO: string,
): ProgressoDoServico {
  const km =
    servico.km !== null &&
    servico.kmAtual !== null &&
    servico.intervaloKm !== null
      ? barra(servico.kmAtual - servico.km, servico.intervaloKm)
      : null;

  const prazo = servico.proximoEm
    ? barra(
        diasEntre(servico.realizadoEm, hojeISO),
        diasEntre(servico.realizadoEm, servico.proximoEm),
      )
    : null;

  return { km, prazo };
}
