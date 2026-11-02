import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { historicoEsteticaService } from "../../services/estetica";
import { mensagemErro } from "../../services/api";
import { formatarData, formatarDataHora } from "../../utils/formatters";
import type { HistoricoDaPlaca } from "../../types/estetica";

const ETAPA_TEXTO = { entrada: "Na entrada", atendimento: "Em atendimento", entrega: "Pronto", entregue: "Entregue" } as const;

/** Histórico do carro pela placa: o que foi feito, quanto custou e quando deve voltar. */
export function HistoricoPlaca() {
  const [placa, setPlaca] = useState("");
  const [historico, setHistorico] = useState<HistoricoDaPlaca | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function buscar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!placa.trim()) return;

    try {
      setBuscando(true);
      setHistorico(await historicoEsteticaService.placa(placa));
    } catch (error) {
      setHistorico(null);
      setErro(mensagemErro(error));
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Histórico por placa</h2>
        <p className="mt-1 text-sm text-gray-500">Digite a placa para ver os serviços, os valores e o retorno previsto.</p>
      </div>

      <form onSubmit={(e) => void buscar(e)} className="flex max-w-md gap-2">
        <label htmlFor="busca-placa" className="sr-only">Placa</label>
        <input id="busca-placa" type="text" maxLength={10} value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="ABC1D23" className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500" />
        <button type="submit" disabled={buscando} className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
          <Search size={14} /> Buscar
        </button>
      </form>

      {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>}

      {historico && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Cartao titulo="Veículo" valor={historico.placa} subtitulo={historico.modelo ?? "modelo não informado"} />
            <Cartao titulo="Total gasto" valor={`R$ ${historico.total_gasto.toFixed(2).replace(".", ",")}`} subtitulo={`${historico.atendimentos.length} atendimento(s)`} />
            <Cartao
              titulo="Retorno previsto"
              valor={historico.retorno_previsto ? formatarData(historico.retorno_previsto) : "—"}
              subtitulo={historico.ultima_entrega ? `última entrega em ${formatarDataHora(historico.ultima_entrega)}` : "ainda sem entrega"}
            />
          </div>

          {historico.atendimentos.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">Nenhum atendimento para esta placa.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {historico.atendimentos.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{a.servicos.join(", ") || "Sem serviços"}</p>
                    <p className="text-xs text-gray-500">{a.entrada_em ? formatarDataHora(a.entrada_em) : "—"} · {ETAPA_TEXTO[a.etapa]}</p>
                  </div>
                  <p className="text-xs text-gray-700">
                    R$ {a.total.toFixed(2).replace(".", ",")} · {a.pago ? "pago" : "em aberto"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Cartao({ titulo, valor, subtitulo }: { titulo: string; valor: string; subtitulo: string }) {
  return (
    <div className="space-y-1 rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{titulo}</p>
      <p className="text-lg font-bold text-gray-900">{valor}</p>
      <p className="text-xs text-gray-500">{subtitulo}</p>
    </div>
  );
}
