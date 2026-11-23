import type { Tom } from "../../components/ui/tons";
import type { StatusOrdemServico } from "../../types/ordemServico";

export const STATUS_LABEL: Record<StatusOrdemServico, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  aguardando_peca: "Aguardando peça",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

/**
 * Tom de cada status de ordem de serviço, um diferente para cada um: aberta
 * ainda não começou (neutro), em andamento está sendo feita (info), aguardando
 * peça está parada e pede atenção (warning), finalizada deu certo (success) e
 * cancelada não vai sair (danger). Nunca a escala "blue", que é a da marca.
 */
export const TOM_DO_STATUS_OS: Record<StatusOrdemServico, Tom> = {
  aberta: "neutral",
  em_andamento: "info",
  aguardando_peca: "warning",
  finalizada: "success",
  cancelada: "danger",
};
