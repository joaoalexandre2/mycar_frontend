import { StatusChip } from "../../components/ui/StatusChip";
import type { StatusManutencao } from "../../types/manutencao";
import { LABEL_DO_STATUS_MANUTENCAO, TOM_DO_STATUS_MANUTENCAO } from "./statusManutencao";

export function StatusManutencaoBadge({
  status,
}: {
  status: StatusManutencao;
}) {
  return (
    <StatusChip tone={TOM_DO_STATUS_MANUTENCAO[status]}>
      {LABEL_DO_STATUS_MANUTENCAO[status]}
    </StatusChip>
  );
}
