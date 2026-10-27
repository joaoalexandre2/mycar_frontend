import type { StatusOrdemServico } from "../../types/ordemServico";

export const STATUS_LABEL: Record<StatusOrdemServico, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  aguardando_peca: "Aguardando peça",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};
