import {
    ArrowUpRight,
    Car,
    CheckCircle2,
    ClipboardList,
    Clock3,
    DollarSign,
    Plus,
    Users,
    Wrench,
  } from "lucide-react";
    import { useEffect, useState } from "react";
import { clientesService } from "../../services/clientes";
import { veiculosService } from "../../services/veiculos";
import { ordensServicoService } from "../../services/ordensServico";
import { manutencoesService } from "../../services/manutencoes";
import { mensagemErro } from "../../services/api";
import { formatarMoeda, formatarData } from "../../utils/formatters";
import type { Cliente } from "../../types/cliente";
import type { Veiculo } from "../../types/veiculo";
import type { OrdemServico } from "../../types/ordemServico";
import type { Manutencao } from "../../types/manutencao";
  
  export function Dashboard() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [ordens, setOrdens] = useState<OrdemServico[]>([]);
    const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
    const [carregando, setCarregando] = useState(true);

      useEffect(() => {
  async function carregar() {
    try {
      const [listaClientes, listaVeiculos, listaOrdens, listaManutencoes] =
        await Promise.all([
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
  
          <button className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700">
            <Plus size={17} />
  
            Nova ordem
          </button>
        </div>
  
        {/* Cards principais */}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Clientes"
            value={totalClientes.toString()}
            description="+8 este mês"
            icon={<Users size={20} />}
          />
  
          <DashboardCard
            title="Veículos"
            value={totalVeiculos.toString()}
            description="+12 este mês"
            icon={<Car size={20} />}
          />
  
          <DashboardCard
            title="Ordens abertas"
            value={ordensAbertas.toString()}
            description="4 aguardando atendimento"
            icon={<ClipboardList size={20} />}
          />
  
          <DashboardCard
            title="Faturamento"
            value={formatarMoeda(faturamento)}
            description="+12,5% este mês"
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
  
              <button className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                Ver todas
                <ArrowUpRight size={14} />
              </button>
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
                            {ordem.veiculo}
                          </p>
  
                          <p className="mt-1 text-[10px] text-gray-400">
                            {ordem.placa}
                          </p>
                        </div>
                      </td>
  
                      <td className="px-5 py-4 text-xs text-gray-500">
                        {ordem.cliente}
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
                value={12}
                percentual={40}
                icon={<ClipboardList size={17} />}
              />
  
              <StatusResumo
                label="Em andamento"
                value={8}
                percentual={27}
                icon={<Clock3 size={17} />}
              />
  
              <StatusResumo
                label="Concluídas"
                value={10}
                percentual={33}
                icon={<CheckCircle2 size={17} />}
              />
            </div>
  
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Total
                </span>
  
                <span className="text-sm font-bold text-gray-900">
                  30 OS
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
            {manutencoes.map((item) => (
              <div
                key={item.id}
                className="p-5 transition hover:bg-gray-50"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Wrench size={17} />
                  </div>
  
                  <span className="rounded-full bg-yellow-50 px-2 py-1 text-[10px] font-semibold text-yellow-700">
                    Agendada
                  </span>
                </div>
  
                <h4 className="text-xs font-semibold text-gray-900">
                  {item.manutencao}
                </h4>
  
                <p className="mt-2 text-xs text-gray-500">
                  {item.veiculo}
                </p>
  
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    {item.placa}
                  </span>
  
                  <span className="text-[10px] font-semibold text-gray-600">
                    {item.data}
                  </span>
                </div>
  
                <p className="mt-3 text-[10px] text-gray-400">
                  Cliente: {item.cliente}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
    status: Ordem["status"];
  }) {
    const config = {
      aberta: {
        label: "Aberta",
        className: "bg-blue-100 text-blue-700",
      },
  
      em_andamento: {
        label: "Em andamento",
        className: "bg-yellow-100 text-yellow-700",
      },
  
      concluida: {
        label: "Concluída",
        className: "bg-green-100 text-green-700",
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
  
  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
