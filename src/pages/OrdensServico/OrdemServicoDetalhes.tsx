import { useState } from "react";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Pencil,
  UserRound,
} from "lucide-react";

import type { OrdemServico } from "../../types/ordemServico";
import { formatarData, formatarMoeda } from "../../utils/formatters";
import { STATUS_LABEL } from "./statusOrdemServico";
import { StatusOrdemServicoBadge } from "./StatusOrdemServicoBadge";

type Aba = "informacoes" | "historico";

interface OrdemServicoDetalhesProps {
  ordem: OrdemServico;
  onVoltar: () => void;
  onEditar: () => void;
  onConcluir: () => void;
  concluindo?: boolean;
}

export function OrdemServicoDetalhes({
  ordem,
  onVoltar,
  onEditar,
  onConcluir,
  concluindo = false,
}: OrdemServicoDetalhesProps) {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("informacoes");
  const veiculo = ordem.veiculo;
  const cliente = veiculo?.cliente;
  const encerrada =
    ordem.status === "finalizada" || ordem.status === "cancelada";

  return (
    <div className="p-4 md:p-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Voltar para a lista de ordens de serviço"
          title="Voltar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft size={17} aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-[21px] font-bold text-gray-900">
              OS-{String(ordem.id).padStart(4, "0")}
            </h2>

            <StatusOrdemServicoBadge status={ordem.status} />
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Ordem de serviço criada em {formatarData(ordem.dataAbertura)}
          </p>
        </div>

        <div className="flex gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={onEditar}
            className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <Pencil size={15} aria-hidden="true" />
            Editar
          </button>

          {!encerrada && (
            <button
              type="button"
              onClick={onConcluir}
              disabled={concluindo}
              className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={15} aria-hidden="true" />
              {concluindo ? "Concluindo..." : "Concluir OS"}
            </button>
          )}
        </div>
      </div>

      {/* Resumo */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Car size={18} />}
          label="Veículo"
          value={
            veiculo
              ? `${veiculo.marca} ${veiculo.modelo}`
              : "Não informado"
          }
          description={veiculo?.placa ?? "—"}
        />

        <SummaryCard
          icon={<UserRound size={18} />}
          label="Cliente"
          value={cliente?.nome ?? "Não informado"}
          description={cliente?.telefone ?? "Proprietário"}
        />

        <SummaryCard
          icon={<ClipboardList size={18} />}
          label="Valor da OS"
          value={formatarMoeda(ordem.valor)}
          description="Valor estimado"
        />
      </div>

      {/* Conteúdo */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Abas */}
        <div
          role="tablist"
          aria-label="Detalhes da ordem de serviço"
          className="flex overflow-x-auto border-b border-gray-200 px-5"
        >
          <Tab
            id="aba-informacoes"
            painel="painel-informacoes"
            active={abaAtiva === "informacoes"}
            onClick={() => setAbaAtiva("informacoes")}
            icon={<FileText size={15} />}
            label="Informações"
          />

          <Tab
            id="aba-historico"
            painel="painel-historico"
            active={abaAtiva === "historico"}
            onClick={() => setAbaAtiva("historico")}
            icon={<Clock size={15} />}
            label="Histórico"
          />
        </div>

        {abaAtiva === "informacoes" && (
          <div
            role="tabpanel"
            id="painel-informacoes"
            aria-labelledby="aba-informacoes"
          >
            <Informacoes ordem={ordem} />
          </div>
        )}

        {abaAtiva === "historico" && (
          <div
            role="tabpanel"
            id="painel-historico"
            aria-labelledby="aba-historico"
          >
            <Historico ordem={ordem} />
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
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 text-gray-500">
        {icon}

        <span className="text-xs font-medium">
          {label}
        </span>
      </div>

      <strong className="block break-words text-sm font-bold text-gray-900">
        {value}
      </strong>

      <span className="mt-1 block text-xs text-gray-500">
        {description}
      </span>
    </div>
  );
}

function Tab({
  id,
  painel,
  active,
  onClick,
  icon,
  label,
}: {
  id: string;
  painel: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={painel}
      onClick={onClick}
      className={`relative flex h-12 shrink-0 items-center gap-2 px-4 text-xs font-medium transition ${
        active
          ? "text-blue-600"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {icon}

      {label}

      {active && (
        <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-600" />
      )}
    </button>
  );
}

function Informacoes({ ordem }: { ordem: OrdemServico }) {
  const veiculo = ordem.veiculo;
  const cliente = veiculo?.cliente;

  return (
    <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2">
      {/* Problema */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Problema relatado
        </h3>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="whitespace-pre-line break-words text-xs leading-6 text-gray-600">
            {ordem.descricao}
          </p>
        </div>
      </div>

      {/* Veículo */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Dados do veículo
        </h3>

        <div className="space-y-3">
          <InfoRow label="Marca" value={veiculo?.marca ?? "—"} />

          <InfoRow label="Modelo" value={veiculo?.modelo ?? "—"} />

          <InfoRow
            label="Ano"
            value={veiculo ? String(veiculo.ano) : "—"}
          />

          <InfoRow label="Placa" value={veiculo?.placa ?? "—"} />
        </div>
      </div>

      {/* Cliente */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Dados do cliente
        </h3>

        <div className="space-y-3">
          <InfoRow label="Nome" value={cliente?.nome ?? "—"} />

          <InfoRow
            label="Telefone"
            value={cliente?.telefone ?? "—"}
          />
        </div>
      </div>

      {/* Datas */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Datas
        </h3>

        <div className="space-y-3">
          <InfoRow
            label="Abertura"
            value={formatarData(ordem.dataAbertura)}
          />

          <InfoRow
            label="Conclusão"
            value={
              ordem.dataFechamento
                ? formatarData(ordem.dataFechamento)
                : "Em aberto"
            }
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2">
      <span className="text-xs text-gray-500">
        {label}
      </span>

      <span className="text-right text-xs font-medium text-gray-700">
        {value}
      </span>
    </div>
  );
}

/**
 * Só o que a ordem de fato registra: a abertura, a situação atual e, quando
 * existe, a data de encerramento. Não há um histórico de alterações no
 * servidor, então nada além disso é mostrado.
 */
function Historico({ ordem }: { ordem: OrdemServico }) {
  const encerrada =
    ordem.status === "finalizada" || ordem.status === "cancelada";

  return (
    <div className="p-6">
      <h3 className="mb-5 text-sm font-semibold text-gray-900">
        Histórico da ordem
      </h3>

      <div className="relative ml-3 border-l border-gray-200 pl-6">
        <TimelineItem
          title="Ordem criada"
          description="A ordem de serviço foi aberta."
          date={formatarData(ordem.dataAbertura)}
          active={!encerrada}
        />

        {encerrada ? (
          <TimelineItem
            title={STATUS_LABEL[ordem.status]}
            description={
              ordem.status === "finalizada"
                ? "O serviço foi concluído."
                : "A ordem de serviço foi cancelada."
            }
            date={
              ordem.dataFechamento
                ? formatarData(ordem.dataFechamento)
                : undefined
            }
            active
          />
        ) : (
          <TimelineItem
            title={STATUS_LABEL[ordem.status]}
            description="Situação atual da ordem."
          />
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  title,
  description,
  date,
  active = false,
}: {
  title: string;
  description: string;
  date?: string;
  active?: boolean;
}) {
  return (
    <div className="relative mb-7 last:mb-0">
      <div
        className={`absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
          active ? "bg-blue-600" : "bg-gray-300"
        }`}
      />

      <h4 className="text-xs font-semibold text-gray-800">
        {title}
      </h4>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>

      {date && (
        <span className="mt-1 block text-xs text-gray-500">
          {date}
        </span>
      )}
    </div>
  );
}
