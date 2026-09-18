import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DollarSign,
  Users,
  Wrench,
} from "lucide-react";
import type { Cliente } from "../../types/cliente";
import type { Veiculo } from "../../types/veiculo";
import type { OrdemServico, StatusOrdemServico } from "../../types/ordemServico";
import type { Manutencao } from "../../types/manutencao";
import { clientesService } from "../../services/clientes";
import { veiculosService } from "../../services/veiculos";
import { ordensServicoService } from "../../services/ordensServico";
import { manutencoesService } from "../../services/manutencoes";
import { mensagemErro } from "../../services/api";
import { formatarData, formatarMoeda } from "../../utils/formatters";

export function Dashboard() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const [
          listaClientes,
          listaVeiculos,
          listaOrdens,
          listaManutencoes,
        ] = await Promise.all([
          clientesService.listar(),
          veiculosService.listar(),
          ordensServicoService.listar(),
          manutencoesService.listar(),
        ]);
        setClientes(listaClientes);
        setVeiculos(listaVeiculos);
        setOrdens(listaOrdens);
        setManutencoes(listaManutencoes);
      } catch (error) {
        window.alert(mensagemErro(error));
      } finally {
        setCarregando(false);
      }
    }

    void carregar();
  }, []);

  const ordensAbertas = ordens.filter(
    (ordem) => ordem.status === "aberta",
  ).length;

  const ordensEmAndamento = ordens.filter(
    (ordem) =>
      ordem.status === "em_andamento" || ordem.status === "aguardando_peca",
  ).length;

  const ordensConcluidas = ordens.filter(
    (ordem) => ordem.status === "finalizada",
  ).length;

  const totalOrdens = ordens.length;

  const faturamento = ordens
    .filter((ordem) => ordem.status === "finalizada")
    .reduce((total, ordem) => total + ordem.valor, 0);

  const ordensRecentes = useMemo(() => {
    return [...ordens]
      .sort((a, b) => (a.dataAbertura < b.dataAbertura ? 1 : -1))
      .slice(0, 5);
  }, [ordens]);

  const proximasManutencoes = useMemo(() => {
    return manutencoes
      .filter((item) => item.status !== "em_dia")
      .slice(0, 3);
  }, [manutencoes]);

  function nomeVeiculo(ordem: OrdemServico) {
    const veiculo =
      ordem.veiculo ?? veiculos.find((item) => item.id === ordem.veiculoId);

    return veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "—";
  }

  function placaVeiculo(ordem: OrdemServico) {
    const veiculo =
      ordem.veiculo ?? veiculos.find((item) => item.id === ordem.veiculoId);

    return veiculo?.placa ?? "—";
  }

  function nomeCliente(ordem: OrdemServico) {
    const veiculo =
      ordem.veiculo ?? veiculos.find((item) => item.id === ordem.veiculoId);

    return veiculo?.cliente?.nome ?? "—";
  }

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h2 className="text-[21px] font-bold text-gray-900">
            Dashboard
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Visão geral da sua oficina.
          </p>
        </div>
      </div>

      {/* Cards principais */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title="Clientes"
          value={carregando ? "—" : clientes.length.toString()}
          description={`${veiculos.length} veículo(s) cadastrado(s)`}
          icon={<Users size={20} />}
        />

        <DashboardCard
          title="Veículos"
          value={carregando ? "—" : veiculos.length.toString()}
          description={`${clientes.length} cliente(s) cadastrado(s)`}
          icon={<Car size={20} />}
        />

        <DashboardCard
          title="Ordens abertas"
          value={carregando ? "—" : ordensAbertas.toString()}
          description={`${ordensEmAndamento} em andamento`}
          icon={<ClipboardList size={20} />}
        />

        <DashboardCard
          title="Faturamento"
          value={carregando ? "—" : formatarMoeda(faturamento)}
          description="Ordens finalizadas"
          icon={<DollarSign size={20} />}
        />
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Ordens recentes */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Ordens de serviço
              </h3>

              <p className="mt-1 text-[11px] text-gray-400">
                Últimas ordens cadastradas
              </p>
            </div>

            <a
              href="/ordens-servico"
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver todas
              <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    OS
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Veículo
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Cliente
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Serviço
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Valor
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {ordensRecentes.map((ordem) => (
                  <tr
                    key={ordem.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-blue-600">
                        #{String(ordem.id).padStart(4, "0")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">
                          {nomeVeiculo(ordem)}
                        </p>

                        <p className="mt-1 text-[10px] text-gray-400">
                          {placaVeiculo(ordem)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-500">
                      {nomeCliente(ordem)}
                    </td>

                    <td className="max-w-[180px] px-5 py-4">
                      <span className="block truncate text-xs text-gray-500">
                        {ordem.descricao}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs font-semibold text-gray-700">
                      {formatarMoeda(ordem.valor)}
                    </td>

                    <td className="px-5 py-4">
                      <Status status={ordem.status} />
                    </td>
                  </tr>
                ))}

                {!carregando && ordensRecentes.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-xs text-gray-400"
                    >
                      Nenhuma ordem de serviço cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribuição */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Status das ordens
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">
              Situação atual das OS
            </p>
          </div>

          <div className="space-y-5 p-5">
            <StatusResumo
              label="Abertas"
              value={ordensAbertas}
              percentual={percentual(ordensAbertas, totalOrdens)}
              icon={<ClipboardList size={17} />}
            />

            <StatusResumo
              label="Em andamento"
              value={ordensEmAndamento}
              percentual={percentual(ordensEmAndamento, totalOrdens)}
              icon={<Clock3 size={17} />}
            />

            <StatusResumo
              label="Concluídas"
              value={ordensConcluidas}
              percentual={percentual(ordensConcluidas, totalOrdens)}
              icon={<CheckCircle2 size={17} />}
            />
          </div>

          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Total
              </span>

              <span className="text-sm font-bold text-gray-900">
                {totalOrdens} OS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Manutenções */}
      <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Próximas manutenções
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">
              Veículos com manutenção programada
            </p>
          </div>

          <Wrench
            size={18}
            className="text-blue-600"
          />
        </div>

        <div className="grid grid-cols-1 divide-y divide-gray-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          {proximasManutencoes.map((item) => {
            const veiculo =
              item.veiculo ??
              veiculos.find((v) => v.id === item.veiculoId);

            return (
              <div
                key={item.id}
                className="p-5 transition hover:bg-gray-50"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Wrench size={17} />
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                      item.status === "atrasada"
                        ? "bg-red-50 text-red-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {item.status === "atrasada" ? "Atrasada" : "Agendada"}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-gray-900">
                  {item.tipo}
                </h4>

                <p className="mt-2 text-xs text-gray-500">
                  {veiculo ? `${veiculo.marca} ${veiculo.modelo}` : "—"}
                </p>

                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    {veiculo?.placa ?? "—"}
                  </span>

                  <span className="text-[10px] font-semibold text-gray-600">
                    {formatarData(item.proximaData)}
                  </span>
                </div>

                <p className="mt-3 text-[10px] text-gray-400">
                  Cliente: {veiculo?.cliente?.nome ?? "—"}
                </p>
              </div>
            );
          })}

          {!carregando && proximasManutencoes.length === 0 && (
            <div className="col-span-full p-10 text-center text-xs text-gray-400">
              Nenhuma manutenção programada no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function percentual(valor: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((valor / total) * 100);
}

function DashboardCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {title}
        </span>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>

      <p className="text-2xl font-bold tracking-tight text-gray-900">
        {value}
      </p>

      <p className="mt-2 text-[10px] text-gray-400">
        {description}
      </p>
    </div>
  );
}

function Status({
  status,
}: {
  status: StatusOrdemServico;
}) {
  const config: Record<StatusOrdemServico, { label: string; className: string }> = {
    aberta: {
      label: "Aberta",
      className: "bg-blue-100 text-blue-700",
    },

    em_andamento: {
      label: "Em andamento",
      className: "bg-yellow-100 text-yellow-700",
    },

    aguardando_peca: {
      label: "Aguardando peça",
      className: "bg-orange-100 text-orange-700",
    },

    finalizada: {
      label: "Concluída",
      className: "bg-green-100 text-green-700",
    },

    cancelada: {
      label: "Cancelada",
      className: "bg-red-100 text-red-700",
    },
  };

  const item = config[status];

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function StatusResumo({
  label,
  value,
  percentual,
  icon,
}: {
  label: string;
  value: number;
  percentual: number;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">
            {icon}
          </span>

          <span className="text-xs text-gray-600">
            {label}
          </span>
        </div>

        <span className="text-xs font-bold text-gray-900">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{
            width: `${percentual}%`,
          }}
        />
      </div>

      <p className="mt-1 text-right text-[10px] text-gray-400">
        {percentual}%
      </p>
    </div>
  );
}
