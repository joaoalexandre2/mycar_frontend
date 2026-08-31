import { useMemo, useState } from "react";
import {
  Car,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
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
  quilometragem: number;
  ativo: boolean;
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

const veiculosIniciais: Veiculo[] = [
  {
    id: 1,
    clienteId: 1,
    placa: "ABC1D23",
    marca: "Honda",
    modelo: "Fit",
    ano: 2018,
    quilometragem: 84500,
    ativo: true,
  },
  {
    id: 2,
    clienteId: 1,
    placa: "DEF2E34",
    marca: "Toyota",
    modelo: "Corolla",
    ano: 2022,
    quilometragem: 42000,
    ativo: true,
  },
  {
    id: 3,
    clienteId: 2,
    placa: "GHI3F45",
    marca: "Chevrolet",
    modelo: "Onix",
    ano: 2021,
    quilometragem: 56300,
    ativo: true,
  },
  {
    id: 4,
    clienteId: 3,
    placa: "JKL4G56",
    marca: "Volkswagen",
    modelo: "Golf",
    ano: 2017,
    quilometragem: 98000,
    ativo: true,
  },
  {
    id: 5,
    clienteId: 4,
    placa: "MNO5H67",
    marca: "Fiat",
    modelo: "Argo",
    ano: 2020,
    quilometragem: 67000,
    ativo: true,
  },
  {
    id: 6,
    clienteId: 5,
    placa: "PQR6I78",
    marca: "Hyundai",
    modelo: "Creta",
    ano: 2023,
    quilometragem: 31000,
    ativo: false,
  },
];

export function Veiculos() {
  const [veiculos, setVeiculos] =
    useState<Veiculo[]>(veiculosIniciais);

  const [busca, setBusca] = useState("");

  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | "ativos" | "inativos">("todos");

  const [modalAberto, setModalAberto] =
    useState(false);

  const [veiculoEditando, setVeiculoEditando] =
    useState<Veiculo | null>(null);

  const veiculosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return veiculos.filter((veiculo) => {
      const cliente = clientes.find(
        (item) => item.id === veiculo.clienteId,
      );

      const correspondeBusca =
        !termo ||
        veiculo.placa
          .toLowerCase()
          .includes(termo) ||
        veiculo.marca
          .toLowerCase()
          .includes(termo) ||
        veiculo.modelo
          .toLowerCase()
          .includes(termo) ||
        cliente?.nome
          .toLowerCase()
          .includes(termo);

      const correspondeStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" &&
          veiculo.ativo) ||
        (filtroStatus === "inativos" &&
          !veiculo.ativo);

      return (
        correspondeBusca &&
        correspondeStatus
      );
    });
  }, [veiculos, busca, filtroStatus]);

  const totalVeiculos = veiculos.length;

  const veiculosAtivos = veiculos.filter(
    (veiculo) => veiculo.ativo,
  ).length;

  const veiculosInativos = veiculos.filter(
    (veiculo) => !veiculo.ativo,
  ).length;

  const quilometragemMedia =
    totalVeiculos > 0
      ? Math.round(
          veiculos.reduce(
            (total, veiculo) =>
              total + veiculo.quilometragem,
            0,
          ) / totalVeiculos,
        )
      : 0;

  function abrirNovoVeiculo() {
    setVeiculoEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(veiculo: Veiculo) {
    setVeiculoEditando(veiculo);
    setModalAberto(true);
  }

  function excluirVeiculo(id: number) {
    const veiculo = veiculos.find(
      (item) => item.id === id,
    );

    if (!veiculo) {
      return;
    }

    const confirmar = window.confirm(
      `Deseja realmente excluir o veículo "${veiculo.marca} ${veiculo.modelo}"?`,
    );

    if (!confirmar) {
      return;
    }

    setVeiculos((veiculosAtuais) =>
      veiculosAtuais.filter(
        (item) => item.id !== id,
      ),
    );
  }

  function salvarVeiculo(veiculo: Veiculo) {
    if (veiculoEditando) {
      setVeiculos((veiculosAtuais) =>
        veiculosAtuais.map((item) =>
          item.id === veiculo.id
            ? veiculo
            : item,
        ),
      );
    } else {
      setVeiculos((veiculosAtuais) => [
        ...veiculosAtuais,
        {
          ...veiculo,
          id: Date.now(),
        },
      ]);
    }

    setModalAberto(false);
    setVeiculoEditando(null);
  }

  function getCliente(clienteId: number) {
    return clientes.find(
      (cliente) => cliente.id === clienteId,
    );
  }

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h2 className="text-[21px] font-bold text-gray-900">
            Veículos
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Cadastre e gerencie os veículos dos clientes.
          </p>
        </div>

        <button
          onClick={abrirNovoVeiculo}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />

          Novo veículo
        </button>
      </div>

      {/* Indicadores */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          label="Total de veículos"
          value={totalVeiculos}
          icon={<Car size={19} />}
        />

        <InfoCard
          label="Veículos ativos"
          value={veiculosAtivos}
          icon={<Car size={19} />}
        />

        <InfoCard
          label="Veículos inativos"
          value={veiculosInativos}
          icon={<Car size={19} />}
        />

        <InfoCard
          label="Km média"
          value={`${formatarNumero(
            quilometragemMedia,
          )} km`}
          icon={<Car size={19} />}
        />
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Barra superior */}
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Veículos cadastrados
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">
              {veiculosFiltrados.length} veículo(s)
              encontrado(s)
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Busca */}
            <div className="relative w-full sm:w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Buscar veículo..."
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
                    | "ativos"
                    | "inativos",
                )
              }
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600 outline-none focus:border-blue-500"
            >
              <option value="todos">
                Todos
              </option>

              <option value="ativos">
                Ativos
              </option>

              <option value="inativos">
                Inativos
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
                  Veículo
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Placa
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Cliente
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Ano
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Quilometragem
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="w-28 px-5 py-3" />
              </tr>
            </thead>

            <tbody>
              {veiculosFiltrados.map((veiculo) => {
                const cliente = getCliente(
                  veiculo.clienteId,
                );

                return (
                  <tr
                    key={veiculo.id}
                    className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                  >
                    {/* Veículo */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Car size={18} />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-900">
                            {veiculo.marca}{" "}
                            {veiculo.modelo}
                          </p>

                          <p className="mt-1 text-[10px] text-gray-400">
                            ID #{veiculo.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Placa */}
                    <td className="px-5 py-4">
                      <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-gray-700">
                        {veiculo.placa}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">
                        {cliente?.nome ??
                          "Cliente não encontrado"}
                      </span>
                    </td>

                    {/* Ano */}
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {veiculo.ano}
                    </td>

                    {/* Quilometragem */}
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-gray-700">
                        {formatarNumero(
                          veiculo.quilometragem,
                        )}{" "}
                        km
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusVeiculo
                        ativo={veiculo.ativo}
                      />
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            abrirEdicao(veiculo)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() =>
                            excluirVeiculo(
                              veiculo.id,
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

              {veiculosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-xs text-gray-400"
                  >
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <VeiculoModal
          veiculo={veiculoEditando}
          onClose={() => {
            setModalAberto(false);
            setVeiculoEditando(null);
          }}
          onSave={salvarVeiculo}
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

function StatusVeiculo({
  ativo,
}: {
  ativo: boolean;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
        ativo
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

function VeiculoModal({
  veiculo,
  onClose,
  onSave,
}: {
  veiculo: Veiculo | null;
  onClose: () => void;
  onSave: (veiculo: Veiculo) => void;
}) {
  const [clienteId, setClienteId] = useState(
    veiculo?.clienteId?.toString() ?? "",
  );

  const [placa, setPlaca] = useState(
    veiculo?.placa ?? "",
  );

  const [marca, setMarca] = useState(
    veiculo?.marca ?? "",
  );

  const [modelo, setModelo] = useState(
    veiculo?.modelo ?? "",
  );

  const [ano, setAno] = useState(
    veiculo?.ano?.toString() ?? "",
  );

  const [quilometragem, setQuilometragem] =
    useState(
      veiculo?.quilometragem?.toString() ?? "",
    );

  const [ativo, setAtivo] = useState(
    veiculo?.ativo ?? true,
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !clienteId ||
      !placa.trim() ||
      !marca.trim() ||
      !modelo.trim() ||
      !ano ||
      !quilometragem
    ) {
      window.alert(
        "Preencha todos os campos obrigatórios.",
      );

      return;
    }

    const anoNumerico = Number(ano);

    const kmNumerica = Number(
      quilometragem,
    );

    const anoAtual =
      new Date().getFullYear();

    if (
      Number.isNaN(anoNumerico) ||
      anoNumerico < 1900 ||
      anoNumerico > anoAtual
    ) {
      window.alert(
        `Informe um ano válido entre 1900 e ${anoAtual}.`,
      );

      return;
    }

    if (
      Number.isNaN(kmNumerica) ||
      kmNumerica < 0
    ) {
      window.alert(
        "Informe uma quilometragem válida.",
      );

      return;
    }

    onSave({
      id: veiculo?.id ?? 0,
      clienteId: Number(clienteId),
      placa: placa
        .trim()
        .toUpperCase(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      ano: anoNumerico,
      quilometragem: kmNumerica,
      ativo,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {veiculo
                ? "Editar veículo"
                : "Novo veículo"}
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">
              Informe os dados do veículo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            {/* Cliente */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Cliente
              </label>

              <select
                value={clienteId}
                onChange={(event) =>
                  setClienteId(
                    event.target.value,
                  )
                }
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-500"
                required
              >
                <option value="">
                  Selecione o cliente
                </option>

                {clientes.map((cliente) => (
                  <option
                    key={cliente.id}
                    value={cliente.id}
                  >
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Marca / Modelo */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Marca
                </label>

                <input
                  type="text"
                  value={marca}
                  onChange={(event) =>
                    setMarca(
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Toyota"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Modelo
                </label>

                <input
                  type="text"
                  value={modelo}
                  onChange={(event) =>
                    setModelo(
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Corolla"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Placa */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Placa
              </label>

              <input
                type="text"
                value={placa}
                onChange={(event) =>
                  setPlaca(
                    event.target.value
                      .toUpperCase(),
                  )
                }
                placeholder="ABC1D23"
                maxLength={7}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs font-semibold tracking-wider text-gray-700 uppercase outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 focus:border-blue-500"
                required
              />
            </div>

            {/* Ano / Km */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Ano
                </label>

                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={ano}
                  onChange={(event) =>
                    setAno(
                      event.target.value,
                    )
                  }
                  placeholder="2020"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Quilometragem
                </label>

                <input
                  type="number"
                  min="0"
                  value={quilometragem}
                  onChange={(event) =>
                    setQuilometragem(
                      event.target.value,
                    )
                  }
                  placeholder="50000"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
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
                value={
                  ativo ? "ativo" : "inativo"
                }
                onChange={(event) =>
                  setAtivo(
                    event.target.value ===
                      "ativo",
                  )
                }
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="ativo">
                  Ativo
                </option>

                <option value="inativo">
                  Inativo
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
              {veiculo
                ? "Salvar alterações"
                : "Criar veículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatarNumero(valor: number) {
  return valor.toLocaleString("pt-BR");
}