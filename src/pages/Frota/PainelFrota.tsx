import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ClipboardCheck, CreditCard, Gauge } from "lucide-react";
import { painelFrotaService } from "../../services/frotaDiferenciais";
import { mensagemErro } from "../../services/api";
import { formatarData, formatarDataHora } from "../../utils/formatters";
import type { AlertasDaFrota, PainelDeDisponibilidade } from "../../types/frota";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

function diaDeHoje(deslocamento = 0): string {
  const data = new Date();
  data.setDate(data.getDate() + deslocamento);

  return data.toISOString().slice(0, 10);
}

/** Painel da frota: o que vence, checklists com problema e quanto cada veículo está parado ou em uso. */
export function PainelFrota() {
  const [alertas, setAlertas] = useState<AlertasDaFrota | null>(null);
  const [painel, setPainel] = useState<PainelDeDisponibilidade | null>(null);
  const [de, setDe] = useState(diaDeHoje(-29));
  const [ate, setAte] = useState(diaDeHoje());
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    painelFrotaService
      .alertas()
      .then((a) => {
        if (ativo) setAlertas(a);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    painelFrotaService
      .disponibilidade(de, ate)
      .then((p) => {
        if (ativo) setPainel(p);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [de, ate]);

  return (
    <div className="space-y-8 p-4 sm:p-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Painel da frota</h2>
        <p className="mt-1 text-sm text-gray-500">O que precisa de atenção e como os veículos estão sendo usados.</p>
      </div>

      {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>}

      {alertas && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Cartao icone={<CreditCard size={16} />} titulo="CNH">
            {alertas.cnh.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhuma CNH vencida ou a vencer em 30 dias.</p>
            ) : (
              alertas.cnh.map((m) => (
                <p key={m.id} className={`text-xs ${m.situacao === "vencida" ? "font-semibold text-red-600" : "text-amber-600"}`}>
                  {m.nome}: {m.situacao === "vencida" ? "vencida" : "vence"} em {formatarData(m.validade)}
                </p>
              ))
            )}
          </Cartao>

          <Cartao icone={<CalendarClock size={16} />} titulo="Revisões">
            {alertas.revisoes.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhuma revisão nos próximos 30 dias.</p>
            ) : (
              alertas.revisoes.map((v) => (
                <p key={v.id} className="text-xs text-amber-600">
                  {v.placa} ({v.nome}): {formatarData(v.data)}
                </p>
              ))
            )}
          </Cartao>

          <Cartao icone={<AlertTriangle size={16} />} titulo="Multas abertas">
            <p className="text-2xl font-bold text-gray-900">{alertas.multas_abertas.quantidade}</p>
            <p className="text-xs text-gray-500">
              R$ {alertas.multas_abertas.valor.toFixed(2).replace(".", ",")} a pagar ou recorrer
            </p>
          </Cartao>

          <Cartao icone={<ClipboardCheck size={16} />} titulo="Checklists com problema">
            {alertas.checklists_com_problema.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhum problema nos últimos 30 dias.</p>
            ) : (
              alertas.checklists_com_problema.slice(0, 5).map((c, i) => (
                <p key={`${c.uso_id}-${c.momento}-${i}`} className="text-xs text-red-600">
                  {c.momento === "saida" ? "Saída" : "Devolução"} · {c.itens.join(", ")} · {formatarDataHora(c.quando)}
                </p>
              ))
            )}
          </Cartao>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="painel-de" className="mb-1.5 block text-xs font-medium text-gray-700">De</label>
            <input id="painel-de" type="date" value={de} max={ate} onChange={(e) => setDe(e.target.value)} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="painel-ate" className="mb-1.5 block text-xs font-medium text-gray-700">Até</label>
            <input id="painel-ate" type="date" value={ate} min={de} onChange={(e) => setAte(e.target.value)} className={classeCampo} />
          </div>
          {painel && (
            <p className="text-sm text-gray-700">
              <Gauge size={16} className="mr-1 inline text-gray-500" />
              Utilização média da frota: <span className="font-bold">{painel.utilizacao_media_pct}%</span>
            </p>
          )}
        </div>

        {painel && painel.veiculos.length === 0 && (
          <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">Nenhum veículo na frota.</p>
        )}

        {painel && painel.veiculos.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {painel.veiculos.map((v) => (
              <li key={v.veiculo_id} className="grid grid-cols-1 gap-3 px-5 py-3 md:grid-cols-[1fr_2fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{v.placa}</p>
                  <p className="text-xs text-gray-500">{v.nome}</p>
                </div>
                <div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100" role="meter" aria-label={`Utilização de ${v.placa}`} aria-valuenow={v.utilizacao_pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${v.utilizacao_pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    {v.utilizacao_pct}% em uso · ociosa {v.ociosidade_pct}% · {v.horas_usadas} h reservadas
                  </p>
                </div>
                <p className="text-xs text-gray-600">
                  {v.reservas} reserva(s) · {v.km_rodados} km · {v.multas} multa(s)
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Cartao({ icone, titulo, children }: { icone: React.ReactNode; titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
      <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
        {icone} {titulo}
      </p>
      {children}
    </div>
  );
}
