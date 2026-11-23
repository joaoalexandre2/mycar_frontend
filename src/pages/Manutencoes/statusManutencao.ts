import type { Tom } from "../../components/ui/tons";
import type { StatusManutencao } from "../../types/manutencao";

/** Em dia é sucesso, próxima pede atenção e atrasada é perigo. */
export const TOM_DO_STATUS_MANUTENCAO: Record<StatusManutencao, Tom> = {
  em_dia: "success",
  proxima: "warning",
  atrasada: "danger",
};

export const LABEL_DO_STATUS_MANUTENCAO: Record<StatusManutencao, string> = {
  em_dia: "Em dia",
  proxima: "Próxima",
  atrasada: "Atrasada",
};
