import { useState } from "react";
import { History, ListChecks, UserCog, Users } from "lucide-react";
import { AcessosHistorico } from "./AcessosHistorico";
import { Grupos } from "./Grupos";
import { MotivosTroca } from "./MotivosTroca";
import { Pessoas } from "./Pessoas";
import { usePodeNaFrota, useUsuarioDaFrota } from "../../hooks/usePodeNaFrota";

type Aba = "motivos" | "grupos" | "pessoas" | "acessos";

/** Gestão da frota: motivos de troca, grupos de usuários, papéis e histórico de acessos. Só administrador e gestor chegam aqui. */
export function ConfiguracoesFrota() {
  const usuario = useUsuarioDaFrota();
  const pode = usePodeNaFrota();
  const [aba, setAba] = useState<Aba>("motivos");
  const ehAdministrador = usuario?.papel === "administrador";

  const abas = (
    [
      ["motivos", "Motivos de troca", ListChecks, "centros_custo"],
      ["grupos", "Grupos de usuários", Users, "grupos"],
      ["pessoas", "Pessoas e papéis", UserCog, "pessoas"],
      ["acessos", "Histórico de acessos", History, "pessoas"],
    ] as const
  ).filter(([chave, , , permissao]) => (chave === "pessoas" || chave === "acessos" ? ehAdministrador : pode(permissao)));

  // Sem permissão para a aba escolhida (ou para a inicial), vale a primeira que a pessoa pode ver.
  const atual = abas.some(([chave]) => chave === aba) ? aba : abas[0]?.[0];

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Gestão da frota</h2>
        <p className="mt-1 text-sm text-gray-500">
          Os motivos das trocas de centro de custo, os grupos de usuários e quem é administrador ou gestor.
        </p>
      </div>

      {abas.length > 0 && (
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200">
          {abas.map(([chave, titulo, Icone]) => (
            <button
              key={chave}
              type="button"
              role="tab"
              aria-selected={atual === chave}
              onClick={() => setAba(chave)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold ${
                atual === chave
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icone size={14} /> {titulo}
            </button>
          ))}
        </div>
      )}

      {atual === "motivos" && <MotivosTroca />}
      {atual === "grupos" && <Grupos />}
      {atual === "pessoas" && <Pessoas />}
      {atual === "acessos" && <AcessosHistorico />}
    </div>
  );
}
