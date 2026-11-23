import { StatusChip } from "../../components/ui/StatusChip";
import type { StatusOrdemServico } from "../../types/ordemServico";
import { STATUS_LABEL, TOM_DO_STATUS_OS } from "./statusOrdemServico";

export function StatusOrdemServicoBadge({
  status,
}: {
  status: StatusOrdemServico;
}) {
  return <StatusChip tone={TOM_DO_STATUS_OS[status]}>{STATUS_LABEL[status]}</StatusChip>;
}
