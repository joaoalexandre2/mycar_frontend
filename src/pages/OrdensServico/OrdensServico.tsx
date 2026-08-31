import { useMemo, useState } from "react";
import {
  ClipboardList,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { OrdemServicoDetalhes } from "./OrdemServicoDetalhes";

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

interface OrdemServico {
  id: number;
  veiculoId: number;
  descricao: string;
  status: "aberta" | "em_andamento" | "concluida" | "cancelada";
  valor: number;
  dataAbertura: string;
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

const ordensIniciais: OrdemServico[] = [
  {
    id: 1,
    veiculoId: 1,
    descricao: "Motor apresentando falhas durante o funcionamento",
    status: "aberta",
    valor: 350,
    dataAbertura: "2026-08-20",
  },
  {
    id: 2,
    veiculoId: 2,
    descricao: "Revisão preventiva de 40.000 km",
    status: "em_andamento",
    valor: 890,
    dataAbertura: "2026-08-21",
  },
  {
    id: 3,
    veiculoId: 3,
    descricao: "Troca de óleo e filtros",
    status: "concluida",
    valor: 420,
    dataAbertura: "2026-08-18",
  },
  {
    id: 4,
    veiculoId: 4,
    descricao: "Sistema de freios apresentando ruído",
    status: "aberta",
    valor: 680,
    dataAbertura: "2026-08-23",
  },
  {
    id: 5,
    veiculoId: 5,
    descricao: "Alinhamento e balanceamento",
    status: "concluida",
    valor: 220,
    dataAbertura: "2026-08-17",
  },
];

export function OrdensServico() {
  const [ordens, setOrdens] = useState<OrdemServico[]>(ordensIniciais);

  const [ordemSelecionada, setOrdemSelecionada] =
    useState<OrdemServico | null>(null);

  const [busca, setBusca] = useState("");

  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [modalAberto, setModalAberto] = useState(false);

  const [ordemEditando, setOrdemEditando] =
    useState<OrdemServico | null>(null);

  const ordensFiltradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return ordens.filter((ordem) => {
      const veiculo = veiculos.find(
        (item) => item.id === ordem.veiculoId,
      );

      const cliente = clientes.find(
        (item) => item.id === veiculo?.clienteId,
      );

      const correspondeBusca =
        !termo ||
        ordem.descricao.toLowerCase().includes(termo) ||
        veiculo?.placa.toLowerCase().includes(termo) ||
        veiculo?.modelo.toLowerCase().includes(termo) ||
        cliente?.nome.toLowerCase().includes(termo);

      const correspondeStatus =
        filtroStatus === "todos" ||
        ordem.status === filtroStatus;

      return correspondeBusca && correspondeStatus;
    });
  }, [ordens, busca, filtroStatus]);

  function abrirNovaOrdem() {
    setOrdemEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(ordem: OrdemServico) {
    setOrdemEditando(ordem);
    setModalAberto(true);
  }

  function abrirDetalhes(ordem: OrdemServico) {
    setOrdemSelecionada(ordem);
  }

  function fecharDetalhes() {
    setOrdemSelecionada(null);
  }

  function excluirOrdem(id: number) {
    const confirmar = window.confirm(
      "Deseja realmente excluir esta ordem de serviço?",
    );

    if (!confirmar) {
      return;
    }

    setOrdens((ordensAtuais) =>
      ordensAtuais.filter((ordem) => ordem.id !== id),
    );

    if (ordemSelecionada?.id === id) {
      setOrdemSelecionada(null);
    }
  }

  function salvarOrdem(ordem: OrdemServico) {
    if (ordemEditando) {
      setOrdens((ordensAtuais) =>
        ordensAtuais.map((item) =>
          item.id === ordem.id ? ordem : item,
        ),
      );

      if (ordemSelecionada?.id === ordem.id) {
        setOrdemSelecionada(ordem);
      }
    } else {
      setOrdens((ordensAtuais) => [
        ...ordensAtuais,
        {
          ...ordem,
          id: Date.now(),
        },
      ]);
    }

    setModalAberto(false);
    setOrdemEditando(null);
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

  const abertas = ordens.filter(
    (ordem) => ordem.status === "aberta",
  ).length;

  const emAndamento = ordens.filter(
    (ordem) => ordem.status === "em_andamento",
  ).length;

  const concluidas = ordens.filter(
    (ordem) => ordem.status === "concluida",
  ).length;

  const valorTotal = ordens.reduce(
    (total, ordem) => total + ordem.valor,
    0,
  );

  /*
   * IMPORTANTE:
   * O detalhe precisa ficar dentro do componente,
   * depois dos Hooks.
   */
  if (ordemSelecionada) {
    return (
      <OrdemServicoDetalhes
        onVoltar={fecharDetalhes}
      />
    );
  }

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h2 className="text-[21px] font-bold text-gray-900">
            Ordens de serviço
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Acompanhe e gerencie os serviços dos veículos.
          </p>
        </div>

        <button
          onClick={abrirNovaOrdem}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />

          Nova ordem
        </button>
      </div>

      {/* Indicadores */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoCard
          label="Ordens abertas"
          value={abertas}
          icon={<ClipboardList size={19} />}
        />

        <InfoCard
          label="Em andamento"
          value={emAndamento}
          icon={<ClipboardList size={19} />}
        />

        <InfoCard
          label="Concluídas"
          value={concluidas}
          icon={<ClipboardList size={19} />}
        />

        <InfoCard
          label="Valor das ordens"
          value={formatarMoeda(valorTotal)}
          icon={<ClipboardList size={19} />}
        />
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Barra superior */}
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Ordens cadastradas
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">
              {ordensFiltradas.length} ordem(ns) encontrada(s)
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
                placeholder="Buscar ordem..."
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
                setFiltroStatus(event.target.value)
              }
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600 outline-none focus:border-blue-500"
            >
              <option value="todos">Todos</option>

              <option value="aberta">Aberta</option>

              <option value="em_andamento">
                Em andamento
              </option>

              <option value="concluida">
                Concluída
              </option>

              <option value="cancelada">
                Cancelada
              </option>
            </select>
          </div>
        </div>

        {/* Tabela */}
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
                  Descrição
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Data
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Valor
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="w-28 px-5 py-3" />
              </tr>
            </thead>

            <tbody>
              {ordensFiltradas.map((ordem) => {
                const veiculo = getVeiculo(ordem.veiculoId);

                const cliente = getCliente(ordem.veiculoId);

                return (
                  <tr
                    key={ordem.id}
                    className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                  >
                    {/* OS */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() =>
                          abrirDetalhes(ordem)
                        }
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        #{String(ordem.id).padStart(4, "0")}
                      </button>
                    </td>

                    {/* Veículo */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-900">
                          {veiculo?.marca}{" "}
                          {veiculo?.modelo}
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

                    {/* Descrição */}
                    <td className="max-w-[280px] px-5 py-4">
                      <span className="block truncate text-xs text-gray-500">
                        {ordem.descricao}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {formatarData(
                        ordem.dataAbertura,
                      )}
                    </td>

                    {/* Valor */}
                    <td className="px-5 py-4 text-xs font-semibold text-gray-700">
                      {formatarMoeda(ordem.valor)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Status status={ordem.status} />
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            abrirEdicao(ordem)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() =>
                            excluirOrdem(ordem.id)
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

              {ordensFiltradas.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-xs text-gray-400"
                  >
                    Nenhuma ordem de serviço encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <OrdemServicoModal
          ordem={ordemEditando}
          onClose={() => {
            setModalAberto(false);
            setOrdemEditando(null);
          }}
          onSave={salvarOrdem}
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

function Status({
  status,
}: {
  status: OrdemServico["status"];
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

function OrdemServicoModal({
  ordem,
  onClose,
  onSave,
}: {
  ordem: OrdemServico | null;
  onClose: () => void;
  onSave: (ordem: OrdemServico) => void;
}) {
  const [veiculoId, setVeiculoId] = useState(
    ordem?.veiculoId?.toString() ?? "",
  );

  const [descricao, setDescricao] = useState(
    ordem?.descricao ?? "",
  );

  const [status, setStatus] = useState<
    OrdemServico["status"]
  >(ordem?.status ?? "aberta");

  const [valor, setValor] = useState(
    ordem?.valor?.toString() ?? "",
  );

  const [dataAbertura, setDataAbertura] = useState(
    ordem?.dataAbertura ??
      new Date().toISOString().split("T")[0],
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !veiculoId ||
      !descricao.trim() ||
      !valor ||
      !dataAbertura
    ) {
      return;
    }

    const valorNumerico = Number(valor);

    if (
      Number.isNaN(valorNumerico) ||
      valorNumerico < 0
    ) {
      window.alert("Informe um valor válido.");

      return;
    }

    onSave({
      id: ordem?.id ?? 0,
      veiculoId: Number(veiculoId),
      descricao,
      status,
      valor: valorNumerico,
      dataAbertura,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {ordem
                ? "Editar ordem de serviço"
                : "Nova ordem de serviço"}
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">
              Informe os dados do serviço.
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
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

            {/* Descrição */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Descrição do problema / serviço
              </label>

              <textarea
                value={descricao}
                onChange={(event) =>
                  setDescricao(event.target.value)
                }
                placeholder="Descreva o problema ou serviço solicitado..."
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Valor / Data */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Valor
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valor}
                  onChange={(event) =>
                    setValor(event.target.value)
                  }
                  placeholder="0,00"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Data de abertura
                </label>

                <input
                  type="date"
                  value={dataAbertura}
                  onChange={(event) =>
                    setDataAbertura(event.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as OrdemServico["status"],
                  )
                }
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="aberta">
                  Aberta
                </option>

                <option value="em_andamento">
                  Em andamento
                </option>

                <option value="concluida">
                  Concluída
                </option>

                <option value="cancelada">
                  Cancelada
                </option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
            >
              {ordem
                ? "Salvar alterações"
                : "Criar ordem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string) {
  return new Date(
    `${data}T00:00:00`,
  ).toLocaleDateString("pt-BR");
}