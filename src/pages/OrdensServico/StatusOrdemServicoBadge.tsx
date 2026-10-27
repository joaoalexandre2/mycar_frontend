import type { StatusOrdemServico } from "../../types/ordemServico";
import { STATUS_LABEL } from "./statusOrdemServico";

const ESTILO: Record<StatusOrdemServico, string> = {
  aberta: "bg-blue-100 text-blue-700",
  em_andamento: "bg-yellow-100 text-yellow-700",
  aguardando_peca: "bg-orange-100 text-orange-700",
  finalizada: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

export function StatusOrdemServicoBadge({
  status,
}: {
  status: StatusOrdemServico;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${ESTILO[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
