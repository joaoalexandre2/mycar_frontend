import { useState } from "react";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Package,
  Pencil,
  Plus,
  UserRound,
  Wrench,
} from "lucide-react";

import type { OrdemServico, StatusOrdemServico } from "../../types/ordemServico";
import { formatarData, formatarMoeda } from "../../utils/formatters";

const STATUS_LABEL: Record<StatusOrdemServico, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  aguardando_peca: "Aguardando peça",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

interface OrdemServicoDetalhesProps {
  ordem: OrdemServico;
  onVoltar: () => void;
}

export function OrdemServicoDetalhes({
  ordem,
  onVoltar,
}: OrdemServicoDetalhesProps) {
  const [abaAtiva, setAbaAtiva] = useState("informacoes");
  const veiculo = ordem.veiculo;
  const cliente = veiculo?.cliente;

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onVoltar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft size={17} />
        </button>

        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[21px] font-bold text-gray-900">
              OS-{String(ordem.id).padStart(4, "0")}
            </h2>

            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
              {STATUS_LABEL[ordem.status]}
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Ordem de serviço criada em {formatarData(ordem.dataAbertura)}
          </p>
        </div>

        <div className="ml-auto flex gap-2">
          <button className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Pencil size={15} />
            Editar
          </button>

          <button className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
            <CheckCircle2 size={15} />
            Concluir OS
          </button>
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
        <div className="flex border-b border-gray-200 px-5">
          <Tab
            active={abaAtiva === "informacoes"}
            onClick={() => setAbaAtiva("informacoes")}
            icon={<FileText size={15} />}
            label="Informações"
          />

          <Tab
            active={abaAtiva === "servicos"}
            onClick={() => setAbaAtiva("servicos")}
            icon={<Wrench size={15} />}
            label="Serviços"
          />

          <Tab
            active={abaAtiva === "pecas"}
            onClick={() => setAbaAtiva("pecas")}
            icon={<Package size={15} />}
            label="Peças"
          />

          <Tab
            active={abaAtiva === "historico"}
            onClick={() => setAbaAtiva("historico")}
            icon={<Clock size={15} />}
            label="Histórico"
          />
        </div>

        {/* Informações */}
        {abaAtiva === "informacoes" && (
          <Informacoes ordem={ordem} />
        )}

        {/* Serviços */}
        {abaAtiva === "servicos" && (
          <Servicos />
        )}

        {/* Peças */}
        {abaAtiva === "pecas" && (
          <Pecas />
        )}

        {/* Histórico */}
        {abaAtiva === "historico" && (
          <Historico />
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
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 text-gray-400">
        {icon}

        <span className="text-[11px] font-medium">
          {label}
        </span>
      </div>

      <strong className="block text-sm font-bold text-gray-900">
        {value}
      </strong>

      <span className="mt-1 block text-[10px] text-gray-400">
        {description}
      </span>
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-12 items-center gap-2 px-4 text-xs font-medium transition ${
        active
          ? "text-blue-600"
          : "text-gray-400 hover:text-gray-700"
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

function Informacoes() {
  return (
    <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-2">
      {/* Problema */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Problema relatado
        </h3>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs leading-6 text-gray-600">
            Motor apresentando falhas durante o funcionamento.
            Cliente relata perda de potência principalmente
            durante aceleração.
          </p>
        </div>
      </div>

      {/* Veículo */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Dados do veículo
        </h3>

        <div className="space-y-3">
          <InfoRow label="Marca" value="Honda" />

          <InfoRow label="Modelo" value="Fit" />

          <InfoRow label="Ano" value="2018" />

          <InfoRow label="Placa" value="ABC1D23" />
        </div>
      </div>

      {/* Cliente */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Dados do cliente
        </h3>

        <div className="space-y-3">
          <InfoRow label="Nome" value="Maria Silva" />

          <InfoRow
            label="Telefone"
            value="(45) 99999-9999"
          />

          <InfoRow
            label="E-mail"
            value="maria@email.com"
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
            value="24/08/2026"
          />

          <InfoRow
            label="Previsão"
            value="26/08/2026"
          />

          <InfoRow
            label="Conclusão"
            value="—"
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
    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
      <span className="text-[11px] text-gray-400">
        {label}
      </span>

      <span className="text-xs font-medium text-gray-700">
        {value}
      </span>
    </div>
  );
}

function Servicos() {
  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Serviços realizados
          </h3>

          <p className="mt-1 text-[11px] text-gray-400">
            Serviços vinculados a esta ordem.
          </p>
        </div>

        <button className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={15} />
          Adicionar serviço
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-gray-500">
                Serviço
              </th>

              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-gray-500">
                Quantidade
              </th>

              <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wide text-gray-500">
                Valor
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="px-4 py-4 text-xs text-gray-700">
                Diagnóstico do motor
              </td>

              <td className="px-4 py-4 text-xs text-gray-500">
                1
              </td>

              <td className="px-4 py-4 text-right text-xs font-semibold text-gray-700">
                R$ 350,00
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pecas() {
  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Peças utilizadas
          </h3>

          <p className="mt-1 text-[11px] text-gray-400">
            Peças utilizadas durante o serviço.
          </p>
        </div>

        <button className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={15} />
          Adicionar peça
        </button>
      </div>

      <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center">
        <Package
          size={30}
          className="mx-auto mb-3 text-gray-300"
        />

        <p className="text-xs font-medium text-gray-500">
          Nenhuma peça adicionada
        </p>

        <p className="mt-1 text-[10px] text-gray-400">
          As peças utilizadas aparecerão aqui.
        </p>
      </div>
    </div>
  );
}

function Historico() {
  return (
    <div className="p-6">
      <h3 className="mb-5 text-sm font-semibold text-gray-900">
        Histórico da ordem
      </h3>

      <div className="relative ml-3 border-l border-gray-200 pl-6">
        <TimelineItem
          title="Ordem criada"
          description="A ordem de serviço foi aberta."
          date="24/08/2026 às 09:20"
          active
        />

        <TimelineItem
          title="Veículo recebido"
          description="Veículo recebido para avaliação."
          date="24/08/2026 às 09:35"
        />

        <TimelineItem
          title="Aguardando diagnóstico"
          description="Aguardando avaliação do mecânico."
          date="24/08/2026 às 10:00"
        />
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
  date: string;
  active?: boolean;
}) {
  return (
    <div className="relative mb-7">
      <div
        className={`absolute -left-[31px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white ${
          active ? "bg-blue-600" : "bg-gray-300"
        }`}
      />

      <h4 className="text-xs font-semibold text-gray-800">
        {title}
      </h4>

      <p className="mt-1 text-[11px] text-gray-500">
        {description}
      </p>

      <span className="mt-1 block text-[10px] text-gray-400">
        {date}
      </span>
    </div>
  );
}