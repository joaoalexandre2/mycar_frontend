import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
  Car,
} from "lucide-react";

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  ativo: boolean;
  quantidadeVeiculos: number;
  dataCadastro: string;
}

const clientesIniciais: Cliente[] = [
  {
    id: 1,
    nome: "Maria Silva",
    cpf: "123.456.789-00",
    telefone: "(45) 99999-1111",
    email: "maria.silva@email.com",
    ativo: true,
    quantidadeVeiculos: 2,
    dataCadastro: "2026-07-10",
  },
  {
    id: 2,
    nome: "Carlos Oliveira",
    cpf: "234.567.890-11",
    telefone: "(45) 99888-2222",
    email: "carlos.oliveira@email.com",
    ativo: true,
    quantidadeVeiculos: 1,
    dataCadastro: "2026-07-14",
  },
  {
    id: 3,
    nome: "Pedro Santos",
    cpf: "345.678.901-22",
    telefone: "(45) 99777-3333",
    email: "pedro.santos@email.com",
    ativo: true,
    quantidadeVeiculos: 1,
    dataCadastro: "2026-07-18",
  },
  {
    id: 4,
    nome: "Ana Costa",
    cpf: "456.789.012-33",
    telefone: "(45) 99666-4444",
    email: "ana.costa@email.com",
    ativo: true,
    quantidadeVeiculos: 1,
    dataCadastro: "2026-07-20",
  },
  {
    id: 5,
    nome: "Rafael Martins",
    cpf: "567.890.123-44",
    telefone: "(45) 99555-5555",
    email: "rafael.martins@email.com",
    ativo: false,
    quantidadeVeiculos: 1,
    dataCadastro: "2026-07-22",
  },
];

export function Clientes() {
  const [clientes, setClientes] =
    useState<Cliente[]>(clientesIniciais);

  const [busca, setBusca] = useState("");

  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | "ativos" | "inativos">("todos");

  const [modalAberto, setModalAberto] =
    useState(false);

  const [clienteEditando, setClienteEditando] =
    useState<Cliente | null>(null);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return clientes.filter((cliente) => {
      const correspondeBusca =
        !termo ||
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.cpf.includes(termo) ||
        cliente.telefone.includes(termo) ||
        cliente.email.toLowerCase().includes(termo);

      const correspondeStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && cliente.ativo) ||
        (filtroStatus === "inativos" && !cliente.ativo);

      return correspondeBusca && correspondeStatus;
    });
  }, [clientes, busca, filtroStatus]);

  const totalClientes = clientes.length;

  const clientesAtivos = clientes.filter(
    (cliente) => cliente.ativo,
  ).length;

  const clientesInativos = clientes.filter(
    (cliente) => !cliente.ativo,
  ).length;

  const totalVeiculos = clientes.reduce(
    (total, cliente) =>
      total + cliente.quantidadeVeiculos,
    0,
  );

  function abrirNovoCliente() {
    setClienteEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setClienteEditando(cliente);
    setModalAberto(true);
  }

  function excluirCliente(id: number) {
    const cliente = clientes.find(
      (item) => item.id === id,
    );

    if (!cliente) {
      return;
    }

    const confirmar = window.confirm(
      `Deseja realmente excluir o cliente "${cliente.nome}"?`,
    );

    if (!confirmar) {
      return;
    }

    setClientes((clientesAtuais) =>
      clientesAtuais.filter(
        (item) => item.id !== id,
      ),
    );
  }

  function salvarCliente(cliente: Cliente) {
    if (clienteEditando) {
      setClientes((clientesAtuais) =>
        clientesAtuais.map((item) =>
          item.id === cliente.id ? cliente : item,
        ),
      );
    } else {
      setClientes((clientesAtuais) => [
        ...clientesAtuais,
        {
          ...cliente,
          id: Date.now(),
        },
      ]);
    }

    setModalAberto(false);
    setClienteEditando(null);
  }

  return (
    <div className="p-8">
      {/* Cabeçalho */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h2 className="text-[21px] font-bold text-gray-900">
            Clientes
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Cadastre e gerencie os clientes da oficina.
          </p>
        </div>

        <button
          onClick={abrirNovoCliente}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />

          Novo cliente
        </button>
      </div>

      {/* Indicadores */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          label="Total de clientes"
          value={totalClientes}
          icon={<UserRound size={19} />}
        />

        <InfoCard
          label="Clientes ativos"
          value={clientesAtivos}
          icon={<UserRound size={19} />}
        />

        <InfoCard
          label="Clientes inativos"
          value={clientesInativos}
          icon={<UserRound size={19} />}
        />

        <InfoCard
          label="Veículos cadastrados"
          value={totalVeiculos}
          icon={<Car size={19} />}
        />
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* Barra superior */}
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Clientes cadastrados
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">
              {clientesFiltrados.length} cliente(s)
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
                placeholder="Buscar cliente..."
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
                  Cliente
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  CPF
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Telefone
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  E-mail
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Veículos
                </th>

                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="w-28 px-5 py-3" />
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                >
                  {/* Cliente */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                        {obterIniciais(cliente.nome)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-gray-900">
                          {cliente.nome}
                        </p>

                        <p className="mt-1 text-[10px] text-gray-400">
                          Cadastro{" "}
                          {formatarData(
                            cliente.dataCadastro,
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* CPF */}
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {cliente.cpf}
                  </td>

                  {/* Telefone */}
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {cliente.telefone}
                  </td>

                  {/* Email */}
                  <td className="px-5 py-4">
                    <span className="text-xs text-gray-500">
                      {cliente.email}
                    </span>
                  </td>

                  {/* Veículos */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600">
                      <Car size={13} />

                      {cliente.quantidadeVeiculos}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusCliente
                      ativo={cliente.ativo}
                    />
                  </td>

                  {/* Ações */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() =>
                          abrirEdicao(cliente)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        onClick={() =>
                          excluirCliente(cliente.id)
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
              ))}

              {clientesFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-xs text-gray-400"
                  >
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <ClienteModal
          cliente={clienteEditando}
          onClose={() => {
            setModalAberto(false);
            setClienteEditando(null);
          }}
          onSave={salvarCliente}
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

function StatusCliente({
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

function ClienteModal({
  cliente,
  onClose,
  onSave,
}: {
  cliente: Cliente | null;
  onClose: () => void;
  onSave: (cliente: Cliente) => void;
}) {
  const [nome, setNome] = useState(
    cliente?.nome ?? "",
  );

  const [cpf, setCpf] = useState(
    cliente?.cpf ?? "",
  );

  const [telefone, setTelefone] = useState(
    cliente?.telefone ?? "",
  );

  const [email, setEmail] = useState(
    cliente?.email ?? "",
  );

  const [ativo, setAtivo] = useState(
    cliente?.ativo ?? true,
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !nome.trim() ||
      !cpf.trim() ||
      !telefone.trim()
    ) {
      window.alert(
        "Preencha os campos obrigatórios.",
      );

      return;
    }

    onSave({
      id: cliente?.id ?? 0,
      nome: nome.trim(),
      cpf: cpf.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      ativo,
      quantidadeVeiculos:
        cliente?.quantidadeVeiculos ?? 0,
      dataCadastro:
        cliente?.dataCadastro ??
        new Date()
          .toISOString()
          .split("T")[0],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {cliente
                ? "Editar cliente"
                : "Novo cliente"}
            </h3>

            <p className="mt-1 text-[11px] text-gray-400">
              Informe os dados do cliente.
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
            {/* Nome */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Nome completo
              </label>

              <input
                type="text"
                value={nome}
                onChange={(event) =>
                  setNome(event.target.value)
                }
                placeholder="Ex.: João da Silva"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                required
              />
            </div>

            {/* CPF / Telefone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  CPF
                </label>

                <input
                  type="text"
                  value={cpf}
                  onChange={(event) =>
                    setCpf(event.target.value)
                  }
                  placeholder="000.000.000-00"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Telefone
                </label>

                <input
                  type="text"
                  value={telefone}
                  onChange={(event) =>
                    setTelefone(
                      event.target.value,
                    )
                  }
                  placeholder="(00) 00000-0000"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="cliente@email.com"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Status
              </label>

              <select
                value={ativo ? "ativo" : "inativo"}
                onChange={(event) =>
                  setAtivo(
                    event.target.value === "ativo",
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
              {cliente
                ? "Salvar alterações"
                : "Criar cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function obterIniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function formatarData(data: string) {
  return new Date(
    `${data}T00:00:00`,
  ).toLocaleDateString("pt-BR");
}