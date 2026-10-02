import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Printer,
  Car,
  ClipboardList,
  DollarSign,
  TrendingUp,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  veiculoHistoricoService,
  type HistoricoVeiculo,
} from "../../services/veiculoHistorico";
import { mensagemErro } from "../../services/api";
import { formatarData, formatarMoeda } from "../../utils/formatters";
import type { StatusOrdemServico } from "../../types/ordemServico";

const STATUS_OS_LABEL: Record<StatusOrdemServico, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  aguardando_peca: "Aguardando peça",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const STATUS_OS_CLASSE: Record<StatusOrdemServico, string> = {
  aberta: "bg-blue-100 text-blue-700",
  em_andamento: "bg-yellow-100 text-yellow-700",
  aguardando_peca: "bg-orange-100 text-orange-700",
  finalizada: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
};

interface EventoTimeline {
  data: string;
  tipo: "ordem" | "manutencao" | "fipe";
  titulo: string;
  descricao: string;
  valor: number | null;
  badge?: { label: string; classe: string };
}

function montarTimeline(historico: HistoricoVeiculo): EventoTimeline[] {
  const eventos: EventoTimeline[] = [];

  for (const ordem of historico.ordensServico) {
    eventos.push({
      data: ordem.dataAbertura,
      tipo: "ordem",
      titulo: `OS-${String(ordem.id).padStart(4, "0")}`,
      descricao: ordem.descricao,
      valor: ordem.valor,
      badge: {
        label: STATUS_OS_LABEL[ordem.status],
        classe: STATUS_OS_CLASSE[ordem.status],
      },
    });
  }

  for (const manutencao of historico.manutencoes) {
    eventos.push({
      data: manutencao.dataManutencao,
      tipo: "manutencao",
      titulo: manutencao.tipo,
      descricao: manutencao.descricao || "Manutenção registrada",
      valor: manutencao.valor,
    });
  }

  for (const item of historico.fipeHistorico) {
    eventos.push({
      data: item.consultadoEm,
      tipo: "fipe",
      titulo: "Consulta FIPE",
      descricao: `Valor de mercado consultado: ${formatarMoeda(item.valor)}`,
      valor: item.valor,
    });
  }

  return eventos.sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
}

const ICONE_POR_TIPO: Record<EventoTimeline["tipo"], React.ReactNode> = {
  ordem: <ClipboardList size={14} />,
  manutencao: <Wrench size={14} />,
  fipe: <TrendingUp size={14} />,
};

const COR_POR_TIPO: Record<EventoTimeline["tipo"], string> = {
  ordem: "bg-blue-600",
  manutencao: "bg-amber-500",
  fipe: "bg-emerald-500",
};

export function VeiculoHistorico({
  veiculoId,
  onVoltar,
}: {
  veiculoId: number;
  onVoltar: () => void;
}) {
  const [historico, setHistorico] = useState<HistoricoVeiculo | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setCarregando(true);
        const dados = await veiculoHistoricoService.buscar(veiculoId);
        if (ativo) setHistorico(dados);
      } catch (error) {
        if (ativo) window.alert(mensagemErro(error));
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [veiculoId]);

  if (carregando) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-xs text-gray-400">Carregando histórico...</p>
      </div>
    );
  }

  if (!historico) {
    return (
      <div className="p-4 md:p-8">
        <button
          onClick={onVoltar}
          className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
        >
          <ArrowLeft size={17} />
        </button>
        <p className="text-xs text-gray-400">Não foi possível carregar o histórico.</p>
      </div>
    );
  }

  const { veiculo } = historico;
  const timeline = montarTimeline(historico);
  const valorFipeAtual = historico.fipeHistorico.at(-1)?.valor ?? veiculo.fipeValor;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onVoltar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 print:hidden"
        >
          <ArrowLeft size={17} />
        </button>

        <div>
          <h2 className="text-[21px] font-bold text-gray-900">
            {veiculo.marca} {veiculo.modelo}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Placa {veiculo.placa} · Ano {veiculo.ano}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50 print:hidden"
          title="Abre a impressão; escolha Salvar como PDF"
        >
          <Printer size={15} />
          Exportar PDF
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<UserRound size={18} />}
          label="Cliente"
          value={veiculo.cliente?.nome ?? "—"}
        />
        <SummaryCard
          icon={<ClipboardList size={18} />}
          label="Ordens de serviço"
          value={String(historico.ordensServico.length)}
        />
        <SummaryCard
          icon={<Wrench size={18} />}
          label="Manutenções"
          value={String(historico.manutencoes.length)}
        />
        <SummaryCard
          icon={<DollarSign size={18} />}
          label="Valor FIPE atual"
          value={valorFipeAtual !== null ? formatarMoeda(valorFipeAtual) : "—"}
        />
      </div>

      {historico.fipeHistorico.length > 1 && (
        <div className="mb-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Valor FIPE ao longo do tempo
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              Histórico das consultas feitas a este veículo.
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {historico.fipeHistorico
              .slice()
              .reverse()
              .map((item, indice) => (
                <div
                  key={`${item.consultadoEm}-${indice}`}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <span className="text-[11px] text-gray-400">
                    {formatarData(item.consultadoEm)}
                  </span>
                  <span className="text-xs font-semibold text-gray-900">
                    {formatarMoeda(item.valor)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Linha do tempo
          </h3>
          <p className="mt-1 text-[11px] text-gray-400">
            Ordens de serviço, manutenções e consultas FIPE, mais recentes primeiro.
          </p>
        </div>

        {timeline.length === 0 ? (
          <div className="p-10 text-center text-xs text-gray-400">
            <Car size={28} className="mx-auto mb-3 text-gray-300" />
            Nenhum evento registrado para este veículo ainda.
          </div>
        ) : (
          <div className="relative p-6">
            <div className="relative ml-3 border-l border-gray-200 pl-6">
              {timeline.map((evento, indice) => (
                <div key={`${evento.tipo}-${indice}`} className="relative mb-7 last:mb-0">
                  <div
                    className={`absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-white ${COR_POR_TIPO[evento.tipo]}`}
                  >
                    {ICONE_POR_TIPO[evento.tipo]}
                  </div>

                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-gray-800">
                      {evento.titulo}
                    </h4>
                    {evento.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${evento.badge.classe}`}
                      >
                        {evento.badge.label}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[11px] text-gray-500">
                    {evento.descricao}
                  </p>

                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[10px] text-gray-400">
                      {formatarData(evento.data)}
                    </span>
                    {evento.valor !== null && (
                      <span className="text-[10px] font-semibold text-gray-600">
                        {formatarMoeda(evento.valor)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 text-gray-400">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <strong className="block truncate text-sm font-bold text-gray-900">
        {value}
      </strong>
    </div>
  );
}
