import { ArrowRight } from "lucide-react";
import { formatarDataHora } from "../../utils/formatters";
import type { TrocaDeCentro } from "../../types/frota";

/** Uma troca de centro de custo: de qual para qual, quem fez, quando e por quê. */
export function LinhaDeTroca({ troca }: { troca: TrocaDeCentro }) {
  return (
    <li className="space-y-0.5 px-5 py-3 text-xs">
      <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-gray-900">
        <span>{troca.de.nome ?? "Sem centro"}</span>
        <ArrowRight size={13} className="text-gray-400" aria-label="para" />
        <span>{troca.para.nome ?? "Sem centro"}</span>
      </p>
      <p className="text-gray-500">
        {formatarDataHora(troca.em)}
        {troca.usuario && ` · por ${troca.usuario}`}
      </p>
      {troca.motivo && <p className="text-gray-700">Motivo: {troca.motivo}</p>}
    </li>
  );
}
