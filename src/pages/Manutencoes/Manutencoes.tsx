import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

interface Cliente {
  id: number;
  nome: string;
}

interface Veiculo {
  id: number;
  clienteId: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
}

type StatusManutencao =
  | "em_dia"
  | "proxima"
  | "atrasada";

interface Manutencao {
  id: number;
  veiculoId: number;
  tipo: string;
  descricao: string;
  ultimaData: string;
  proximaData: string;
  ultimaKm: number;
  proximaKm: number;
  status: StatusManutencao;
}

const clientes: Cliente[] = [
  {
    id: 1,
    nome: "Maria Silva",
  },
  {
    id: 2,
    nome: "Carlos Oliveira",
  },
  {
    id: 3,
    nome: "Pedro Santos",
  },
  {
    id: 4,
    nome: "Ana Costa",
  },
  {
    id: 5,
    nome: "Rafael Martins",
  },
];

const veiculos: Veiculo[] = [
  {
    id: 1,
    clienteId: 1,
    placa: "ABC1D23",
    marca: "Honda",
    modelo: "Fit",
    ano: 2018,
  },
  {
    id: 2,
    clienteId: 1,
    placa: "DEF2E34",
    marca: "Toyota",
    modelo: "Corolla",
    ano: 2022,
  },
  {
    id: 3,
    clienteId: 2,
    placa: "GHI3F45",
    marca: "Chevrolet",
    modelo: "Onix",
    ano: 2021,
  },
  {
    id: 4,
    clienteId: 3,
    placa: "JKL4G56",
    marca: "Volkswagen",
    modelo: "Golf",
    ano: 2017,
  },
  {
    id: 5,
    clienteId: 4,
    placa: "MNO5H67",
    marca: "Fiat",
    modelo: "Argo",
    ano: 2020,
  },
  {
    id: 6,
    clienteId: 5,
    placa: "PQR6I78",
    marca: "Hyundai",
    modelo: "Creta",
    ano: 2023,
  },
];

const manutencoesIniciais: Manutencao[] = [
  {
    id: 1,
    veiculoId: 1,
    tipo: "Troca de óleo",
    descricao: "Troca de óleo e filtro do motor",
    ultimaData: "2026-05-20",
    proximaData: "2026-09-20",
    ultimaKm: 85000,
    proximaKm: 95000,
    status: "proxima",
  },
  {
    id: 2,
    veiculoId: 2,
    tipo: "Revisão",
    descricao: "Revisão preventiva de 40.000 km",
    ultimaData: "2026-06-10",
    proximaData: "2026-10-10",
    ultimaKm: 40000,
    proximaKm: 50000,
    status: "em_dia",
  },
  {
    id: 3,
    veiculoId: 3,
    tipo: "Freios",
    descricao: "Inspeção e substituição das pastilhas",
    ultimaData: "2026-02-15",
    proximaData: "2026-08-15",
    ultimaKm: 52000,
    proximaKm: 62000,
    status: "atrasada",
  },
  {
    id: 4,
    veiculoId: 4,
    tipo: "Alinhamento",
    descricao: "Alinhamento e balanceamento",
    ultimaData: "2026-07-01",
    proximaData: "2026-10-01",
    ultimaKm: 71000,
    proximaKm: 81000,
    status: "em_dia",
  },
  {
    id: 5,
    veiculoId: 5,
    tipo: "Troca de óleo",
    descricao: "Troca de óleo, filtro de óleo e filtro de ar",
    ultimaData: "2026-04-12",
    proximaData: "2026-08-30",
    ultimaKm: 30000,
    proximaKm: 40000,
    status: "proxima",
  },
  {
    id: 6,
    veiculoId: 6,
    tipo: "Revisão",
    descricao: "Revisão geral do veículo",
    ultimaData: "2026-01-20",
    proximaData: "2026-07-20",
    ultimaKm: 20000,
    proximaKm: 30000,
    status: "atrasada",
  },
];

export function Manutencoes() {
  const [manutencoes, setManutencoes] = useState(
    manutencoesIniciais,
  );

  const [busca, setBusca] = useState("");

  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | StatusManutencao>("todos");

  const [modalAberto, setModalAberto] = useState(false);

  const [manutencaoEditando, setManutencaoEditando] =
    useState<Manutencao | null>(null);

  const manutencoesFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return manutencoes.filter((manutencao) => {
      const veiculo = veiculos.find(
        (item) => item.id === manutencao.veiculoId,
      );

      const cliente = clientes.find(
        (item) => item.id === veiculo?.clienteId,
      );

      const correspondeBusca =
        !termo ||
        manutencao.tipo.toLowerCase().includes(termo) ||
        manutencao.descricao.toLowerCase().includes(termo) ||
        veiculo?.placa.toLowerCase().includes(termo) ||
        veiculo?.modelo.toLowerCase().includes(termo) ||
        cliente?.nome.toLowerCase().includes(termo);

      const correspondeStatus =
        filtroStatus === "todos" ||
        manutencao.status === filtroStatus;

      return correspondeBusca && correspondeStatus;
    });
  }, [manutencoes, busca, filtroStatus]);

  const emDia = manutencoes.filter(
    (item) => item.status === "em_dia",
  ).length;

  const proximas = manutencoes.filter(
    (item) => item.status === "proxima",
  ).length;

  const atrasadas = manutencoes.filter(
    (item) => item.status === "atrasada",
  ).length;

  const veiculosMonitorados = new Set(
    manutencoes.map((item) => item.veiculoId),
  ).size;

  function abrirNovaManutencao() {
    setManutencaoEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(manutencao: Manutencao) {
    setManutencaoEditando(manutencao);
    setModalAberto(true);
  }

  function excluirManutencao(id: number) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta manutenção?",
    );

    if (!confirmar) {
      return;
    }

    setManutencoes((atuais) =>
      atuais.filter((item) => item.id !== id),
    );
  }

  function salvarManutencao(manutencao: Manutencao) {
    if (manutencaoEditando) {
      setManutencoes((atuais) =>
        atuais.map((item) =>
          item.id === manutencao.id ? manutencao : item,
        ),
      );
    } else {
      setManutencoes((atuais) => [
        ...atuais,
        {
          ...manutencao,
          id: Date.now(),
        },
      ]);
    }

    setModalAberto(false);
    setManutencaoEditando(null);
  }

  function getVeiculo(veiculoId: number) {
    return veiculos.find(
      (veiculo) => veiculo.id === veiculoId,
    );
  }

  function getCliente(veiculoId: number) {
    const veiculo = getVeiculo(veiculoId);

    return clientes.find(
      (cliente) => cliente.id === veiculo?.clienteId,
    );
  }

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h2 className="text-[21px] font-bold text-gray-900">
            Manutenções
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Acompanhe as manutenções e os próximos serviços dos
            veículos.
          </p>
        </div>

        <button
          onClick={abrirNovaManutencao}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />

          Nova manutenção
        </button>
      </div>

      {/* Indicadores */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoCard
          label="Manutenções em dia"
          value={emDia}
          icon={<CheckCircle2 size={19} />}
        />

        <InfoCard
          label="Próximas"
          value={proximas}
          icon={<Clock size={19} />}
        />

        <InfoCard
          label="Atrasadas"
          value={atrasadas}
          icon={<AlertTriangle size={19} />}
        />

        <InfoCard
          label="Veículos monitorados"
          value={veiculosMonitorados}
          icon={<Car size={19} />}
        />
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Barra superior */}
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Manutenções cadastradas
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">
              {manutencoesFiltradas.length} manutenção(ões)
              encontrada(s)
            </p>
          </div>

          <div className="flex gap-3">
            {/* Busca */}
            <div className="relative w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Buscar manutenção..."
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white"
              />
            </div>

            {/* Filtro */}
            <select
              value={filtroStatus}
              onChange={(event) =>
                setFiltroStatus(
                  event.target.value as
                    | "todos"
                    | StatusManutencao,
                )
              }
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600 outline-none focus:border-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="em_dia">Em dia</option>
              <option value="proxima">Próxima</option>
              <option value="atrasada">Atrasada</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Manutenção
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Veículo
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Cliente
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Última
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Próxima
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  KM
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Situação
                </th>

                <th className="w-28 px-5 py-3" />
              </tr>
            </thead>

            <tbody>
              {manutencoesFiltradas.map((manutencao) => {
                const veiculo = getVeiculo(
                  manutencao.veiculoId,
                );

                const cliente = getCliente(
                  manutencao.veiculoId,
                );

                return (
                  <tr
                    key={manutencao.id}
                    className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                  >
                    {/* Manutenção */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Wrench size={17} />
                        </div>

                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="text-xs font-semibold text-gray-900">
                            {manutencao.tipo}
                          </span>

                          <span className="max-w-[220px] truncate text-[10px] text-gray-400">
                            {manutencao.descricao}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Veículo */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-900">
                          {veiculo?.marca} {veiculo?.modelo}
                        </span>

                        <span className="text-[10px] text-gray-400">
                          {veiculo?.placa}
                        </span>
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {cliente?.nome}
                    </td>

                    {/* Última */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-600">
                          {formatarData(
                            manutencao.ultimaData,
                          )}
                        </span>

                        <span className="text-[10px] text-gray-400">
                          {formatarKm(manutencao.ultimaKm)}
                        </span>
                      </div>
                    </td>

                    {/* Próxima */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays
                          size={14}
                          className="text-gray-400"
                        />

                        <span className="text-xs text-gray-600">
                          {formatarData(
                            manutencao.proximaData,
                          )}
                        </span>
                      </div>
                    </td>

                    {/* KM */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-gray-700">
                        {formatarKm(
                          manutencao.proximaKm,
                        )}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusManutencaoBadge
                        status={manutencao.status}
                      />
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            abrirEdicao(manutencao)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() =>
                            excluirManutencao(
                              manutencao.id,
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>

                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                          title="Mais opções"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {manutencoesFiltradas.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-xs text-gray-400"
                  >
                    Nenhuma manutenção encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <ManutencaoModal
          manutencao={manutencaoEditando}
          onClose={() => {
            setModalAberto(false);
            setManutencaoEditando(null);
          }}
          onSave={salvarManutencao}
        />
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {label}
        </span>

        <span className="text-blue-600">
          {icon}
        </span>
      </div>

      <strong className="text-2xl font-bold text-gray-900">
        {value}
      </strong>
    </div>
  );
}

function StatusManutencaoBadge({
  status,
}: {
  status: StatusManutencao;
}) {
  const config = {
    em_dia: {
      label: "Em dia",
      className: "bg-green-100 text-green-700",
    },

    proxima: {
      label: "Próxima",
      className: "bg-yellow-100 text-yellow-700",
    },

    atrasada: {
      label: "Atrasada",
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

function ManutencaoModal({
  manutencao,
  onClose,
  onSave,
}: {
  manutencao: Manutencao | null;
  onClose: () => void;
  onSave: (manutencao: Manutencao) => void;
}) {
  const [veiculoId, setVeiculoId] = useState(
    manutencao?.veiculoId?.toString() ?? "",
  );

  const [tipo, setTipo] = useState(
    manutencao?.tipo ?? "",
  );

  const [descricao, setDescricao] = useState(
    manutencao?.descricao ?? "",
  );

  const [ultimaData, setUltimaData] = useState(
    manutencao?.ultimaData ??
      new Date().toISOString().split("T")[0],
  );

  const [proximaData, setProximaData] = useState(
    manutencao?.proximaData ?? "",
  );

  const [ultimaKm, setUltimaKm] = useState(
    manutencao?.ultimaKm?.toString() ?? "",
  );

  const [proximaKm, setProximaKm] = useState(
    manutencao?.proximaKm?.toString() ?? "",
  );

  const [status, setStatus] =
    useState<StatusManutencao>(
      manutencao?.status ?? "em_dia",
    );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !veiculoId ||
      !tipo.trim() ||
      !descricao.trim() ||
      !ultimaData ||
      !proximaData ||
      !ultimaKm ||
      !proximaKm
    ) {
      window.alert(
        "Preencha todos os campos obrigatórios.",
      );

      return;
    }

    const ultimaKmNumerica = Number(ultimaKm);
    const proximaKmNumerica = Number(proximaKm);

    if (
      Number.isNaN(ultimaKmNumerica) ||
      Number.isNaN(proximaKmNumerica) ||
      ultimaKmNumerica < 0 ||
      proximaKmNumerica < 0
    ) {
      window.alert("Informe uma quilometragem válida.");

      return;
    }

    onSave({
      id: manutencao?.id ?? 0,
      veiculoId: Number(veiculoId),
      tipo: tipo.trim(),
      descricao: descricao.trim(),
      ultimaData,
      proximaData,
      ultimaKm: ultimaKmNumerica,
      proximaKm: proximaKmNumerica,
      status,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {manutencao
                ? "Editar manutenção"
                : "Nova manutenção"}
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">
              Cadastre os dados do acompanhamento.
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
            {/* Veículo */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Veículo
              </label>

              <select
                value={veiculoId}
                onChange={(event) =>
                  setVeiculoId(event.target.value)
                }
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                required
              >
                <option value="">
                  Selecione o veículo
                </option>

                {veiculos.map((veiculo) => {
                  const cliente = clientes.find(
                    (item) =>
                      item.id === veiculo.clienteId,
                  );

                  return (
                    <option
                      key={veiculo.id}
                      value={veiculo.id}
                    >
                      {veiculo.marca} {veiculo.modelo} -{" "}
                      {veiculo.placa} - {cliente?.nome}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Tipo de manutenção
              </label>

              <input
                type="text"
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value)
                }
                placeholder="Ex.: Troca de óleo"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Descrição
              </label>

              <textarea
                value={descricao}
                onChange={(event) =>
                  setDescricao(event.target.value)
                }
                placeholder="Descreva a manutenção..."
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Última manutenção
                </label>

                <input
                  type="date"
                  value={ultimaData}
                  onChange={(event) =>
                    setUltimaData(event.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Próxima manutenção
                </label>

                <input
                  type="date"
                  value={proximaData}
                  onChange={(event) =>
                    setProximaData(event.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* KM */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  KM atual
                </label>

                <input
                  type="number"
                  min="0"
                  value={ultimaKm}
                  onChange={(event) =>
                    setUltimaKm(event.target.value)
                  }
                  placeholder="Ex.: 50000"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Próxima KM
                </label>

                <input
                  type="number"
                  min="0"
                  value={proximaKm}
                  onChange={(event) =>
                    setProximaKm(event.target.value)
                  }
                  placeholder="Ex.: 60000"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Situação
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as StatusManutencao,
                  )
                }
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="em_dia">
                  Em dia
                </option>

                <option value="proxima">
                  Próxima
                </option>

                <option value="atrasada">
                  Atrasada
                </option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              {manutencao
                ? "Salvar alterações"
                : "Criar manutenção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatarData(data: string) {
  return new Date(
    `${data}T00:00:00`,
  ).toLocaleDateString("pt-BR");
}

function formatarKm(km: number) {
  return `${km.toLocaleString("pt-BR")} km`;
}