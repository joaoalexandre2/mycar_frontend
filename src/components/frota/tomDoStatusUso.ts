import type { StatusUso } from "../../types/frota";
import type { Tom } from "../ui/tons";

/**
 * Tom de cada status de uso. "Agendado" fica neutro (nunca a cor da marca,
 * que é a mesma dos botões e do erro); "cancelado" também, riscado.
 */
export const TOM_DO_STATUS_USO: Record<StatusUso, Tom> = {
  agendado: "neutral",
  em_uso: "info",
  concluido: "success",
  cancelado: "neutral",
};
