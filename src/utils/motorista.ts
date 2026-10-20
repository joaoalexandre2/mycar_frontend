export type SituacaoDaCnh = "vencida" | "vence_em_breve" | "em_dia";

/** Quantos dias antes do vencimento a CNH passa a aparecer como "vence em breve". */
export const DIAS_DE_AVISO_DA_CNH = 30;

/**
 * Situação da CNH pela validade ("2028-05-01"). Sem validade informada, não há
 * o que avisar (devolve null). O dia do vencimento ainda vale.
 */
export function situacaoDaCnh(validade: string | null, hoje: Date = new Date()): SituacaoDaCnh | null {
  if (!validade || !/^\d{4}-\d{2}-\d{2}$/.test(validade)) return null;

  const [ano, mes, dia] = validade.split("-").map(Number);
  const fimDoDia = new Date(ano, mes - 1, dia, 23, 59, 59);
  const comeco = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  // Dias inteiros que faltam, contando até o fim do dia do vencimento.
  const dias = Math.floor((fimDoDia.getTime() - comeco.getTime()) / 86_400_000);

  if (fimDoDia.getTime() < hoje.getTime()) return "vencida";

  return dias <= DIAS_DE_AVISO_DA_CNH ? "vence_em_breve" : "em_dia";
}
