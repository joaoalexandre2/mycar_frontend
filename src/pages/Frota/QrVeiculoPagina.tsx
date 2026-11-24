import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert } from "../../components/ui/Alert";
import { Carregando } from "../../components/ui/Carregando";
import { TITULO_DE_SECAO } from "../../components/ui/escalaDeTitulos";
import { StatusChip } from "../../components/ui/StatusChip";
import { Car } from "lucide-react";
import { ChecklistModal } from "../../components/frota/ChecklistModal";
import { qrService } from "../../services/frotaDiferenciais";
import { mensagemErro } from "../../services/api";
import { formatarDataHora } from "../../utils/formatters";
import type { MomentoDoChecklist, ResolucaoDoQr } from "../../types/frota";

/** Tela que abre quando alguém escaneia o QR Code do veículo: reservas de hoje e checklist. */
export function QrVeiculoPagina() {
  const { token = "" } = useParams();
  const [dados, setDados] = useState<ResolucaoDoQr | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);
  const [checklistDe, setChecklistDe] = useState<{ usoId: number; momento: MomentoDoChecklist } | null>(null);

  useEffect(() => {
    let ativo = true;

    qrService
      .resolver(token)
      .then((resposta) => {
        if (!ativo) return;
        setDados(resposta);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [token, versao]);

  if (erro) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6">
        <Alert tone="danger">{erro}</Alert>
        <Link to="/" className="text-xs font-semibold text-blue-600">Voltar ao início</Link>
      </div>
    );
  }

  if (!dados) {
    return <Carregando texto="Carregando o veículo..." className="p-6" />;
  }

  return (
    <div className="mx-auto max-w-md space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <Car size={22} className="text-gray-500" />
        <div>
          <p className="text-sm font-bold text-gray-900">{dados.veiculo.placa}</p>
          <p className="text-xs text-gray-500">{dados.veiculo.nome}</p>
          {dados.veiculo.km_atual !== null && <p className="text-xs text-gray-500">Km atual: {dados.veiculo.km_atual}</p>}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className={TITULO_DE_SECAO}>Reservas de hoje</h2>

        {dados.reservas.length === 0 && (
          <p className="rounded-lg bg-gray-50 px-4 py-4 text-xs text-gray-500">
            Nenhuma reserva sua para este veículo agora. Veja a agenda para reservar.
          </p>
        )}

        {dados.reservas.map((r) => (
          <article key={r.id} className="space-y-2 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold text-gray-900">
              {r.inicio ? formatarDataHora(r.inicio) : "—"} até {r.fim ? formatarDataHora(r.fim) : "—"}
            </p>
            <p className="text-xs text-gray-500">
              {r.motorista ?? "Sem motorista"}
              {r.finalidade ? ` · ${r.finalidade}` : ""}
            </p>
            {r.checklist_feito ? (
              <p>
                <StatusChip tone="success">
                  Checklist de {r.momento === "saida" ? "saída" : "devolução"} já feito
                </StatusChip>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setChecklistDe({ usoId: r.id, momento: r.momento })}
                className="h-10 w-full rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Fazer checklist de {r.momento === "saida" ? "saída" : "devolução"}
              </button>
            )}
          </article>
        ))}
      </section>

      {checklistDe && (
        <ChecklistModal
          usoId={checklistDe.usoId}
          momento={checklistDe.momento}
          onSalvo={() => {
            setChecklistDe(null);
            setVersao((v) => v + 1);
          }}
          onClose={() => setChecklistDe(null)}
        />
      )}
    </div>
  );
}
