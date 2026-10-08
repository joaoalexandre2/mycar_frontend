import { Wrench } from "lucide-react";
import { formatarData, formatarKm, formatarMoeda, hojeISO } from "../../utils/formatters";
import {
  limitarFracao,
  progressoDoServico,
  type BarraDeProgresso,
} from "../../utils/progressoServico";
import type { Servico, SituacaoServico } from "../../types/conta";

const SITUACAO: Record<SituacaoServico, { texto: string; pilula: string; barra: string }> = {
  em_dia: { texto: "Em dia", pilula: "bg-gray-100 text-gray-600", barra: "bg-gray-800" },
  vence_em_breve: { texto: "Trocar em breve", pilula: "bg-blue-100 text-blue-700", barra: "bg-blue-600" },
  vencido: { texto: "Vencido", pilula: "bg-red-100 text-red-700", barra: "bg-red-600" },
  sem_aviso: { texto: "Sem aviso", pilula: "bg-gray-100 text-gray-500", barra: "bg-gray-300" },
  anterior: { texto: "Anterior", pilula: "bg-gray-100 text-gray-400", barra: "bg-gray-300" },
};

function numero(n: number) {
  return Math.round(n).toLocaleString("pt-BR");
}

function Barra({
  rotulo,
  barra,
  unidade,
  cor,
}: {
  rotulo: string;
  barra: BarraDeProgresso;
  unidade: string;
  cor: string;
}) {
  const percentual = Math.round(limitarFracao(barra.fracao) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
          {rotulo}
        </span>
        <span className="font-display text-xl leading-none font-semibold text-gray-900">
          {numero(barra.usado)}
          <span className="text-sm font-medium text-gray-400">
            {" / "}
            {numero(barra.total)} {unidade}
          </span>
        </span>
      </div>

      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-label={`${rotulo}: ${percentual}% do intervalo`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentual}
      >
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${percentual}%` }} />
      </div>
    </div>
  );
}

function textoRestante(servico: Servico) {
  const partes: string[] = [];

  if (servico.kmRestante !== null) {
    partes.push(
      servico.kmRestante <= 0
        ? `passou ${formatarKm(Math.abs(servico.kmRestante))}`
        : `faltam ${formatarKm(servico.kmRestante)}`,
    );
  }

  if (servico.diasRestantes !== null) {
    partes.push(
      servico.diasRestantes < 0
        ? `${Math.abs(servico.diasRestantes)} dia(s) de atraso`
        : servico.diasRestantes === 0
          ? "vence hoje"
          : `${servico.diasRestantes} dia(s)`,
    );
  }

  return partes.join(" ou ");
}

/** Cartão de um serviço vigente: o que já andou do intervalo, em barras, e o que falta. */
export function CartaoServico({ servico }: { servico: Servico }) {
  const situacao = SITUACAO[servico.situacao];
  const { km, prazo } = progressoDoServico(servico, hojeISO());
  const restante = textoRestante(servico);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <Wrench size={17} />
        </span>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[13px] font-semibold text-gray-900">
            {servico.rotulo}
          </h4>
          <p className="mt-0.5 truncate text-[11px] text-gray-500">
            {servico.veiculo} · {servico.placa}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${situacao.pilula}`}
        >
          {situacao.texto}
        </span>
      </header>

      <div className="mt-4 space-y-3">
        {km && <Barra rotulo="Quilometragem" barra={km} unidade="km" cor={situacao.barra} />}
        {prazo && <Barra rotulo="Prazo" barra={prazo} unidade="dias" cor={situacao.barra} />}

        {!km && !prazo && (
          <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-[11px] leading-relaxed text-gray-500">
            {servico.situacao === "sem_aviso"
              ? "Sem aviso da próxima troca. Ao registrar de novo, escolha um prazo ou uma quilometragem."
              : "Informe o km do veículo no dia do serviço para acompanhar a quilometragem."}
          </p>
        )}
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-gray-100 pt-3 text-[11px]">
        <span className={servico.situacao === "vencido" ? "font-semibold text-red-600" : "text-gray-600"}>
          {restante || "—"}
        </span>
        <span className="text-gray-400">
          Feito em {formatarData(servico.realizadoEm)}
          {servico.km !== null && ` · ${formatarKm(servico.km)}`}
          {servico.valor !== null && ` · ${formatarMoeda(servico.valor)}`}
        </span>
      </footer>
    </article>
  );
}
