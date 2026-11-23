import { useState } from "react";
import { History, ListChecks, UserCog, Users } from "lucide-react";
import { Abas } from "../../components/ui/Abas";
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
      { chave: "motivos", titulo: "Motivos de troca", icone: ListChecks, permissao: "centros_custo" },
      { chave: "grupos", titulo: "Grupos de usuários", icone: Users, permissao: "grupos" },
      { chave: "pessoas", titulo: "Pessoas e papéis", icone: UserCog, permissao: "pessoas" },
      { chave: "acessos", titulo: "Histórico de acessos", icone: History, permissao: "pessoas" },
    ] as const
  ).filter(({ chave, permissao }) => (chave === "pessoas" || chave === "acessos" ? ehAdministrador : pode(permissao)));

  // Sem permissão para a aba escolhida (ou para a inicial), vale a primeira que a pessoa pode ver.
  const atual = abas.some(({ chave }) => chave === aba) ? aba : abas[0]?.chave;

  return (
    // O título e o subtítulo da página já estão no cabeçalho (Header): o corpo começa nas abas.
    <div className="space-y-6 p-4 sm:p-8">
      <Abas itens={abas} atual={atual} onMudar={setAba} rotulo="Gestão da frota">
        {atual === "motivos" && <MotivosTroca />}
        {atual === "grupos" && <Grupos />}
        {atual === "pessoas" && <Pessoas />}
        {atual === "acessos" && <AcessosHistorico />}
      </Abas>
    </div>
  );
}
