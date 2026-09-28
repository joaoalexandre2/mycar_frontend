import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
  Car,
} from "lucide-react";
import type { Cliente } from "../../types/cliente";
import {
  clientesService,
  type ResumoClientes,
} from "../../services/clientes";
import { mensagemErro } from "../../services/api";
import {
  formatarCpf,
  formatarData,
  soDigitos,
} from "../../utils/formatters";

const RESUMO_INICIAL: ResumoClientes = {
  total: 0,
  ativos: 0,
  inativos: 0,
  totalVeiculos: 0,
};

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | "ativos" | "inativos">("todos");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [resumo, setResumo] = useState<ResumoClientes>(RESUMO_INICIAL);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] =
    useState<Cliente | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
      setPagina(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [busca]);


  async function carregarClientes() {
    try {
      setCarregando(true);
      const resultado = await clientesService.listarPaginado({
        pagina,
        busca: buscaDebounced,
        status: filtroStatus,
      });

      if (
        resultado.dados.length === 0 &&
        pagina > 1 &&
        resultado.totalRegistros > 0
      ) {
        setPagina((atual) => Math.max(1, atual - 1));
        return;
      }

      setClientes(resultado.dados);
      setTotalPaginas(resultado.totalPaginas);
      setTotalRegistros(resultado.totalRegistros);
      setResumo(resultado.resumo);
    } catch (error) {
      window.alert(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, buscaDebounced, filtroStatus]);

  function abrirNovoCliente() {
    setClienteEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setClienteEditando(cliente);
    setModalAberto(true);
  }

  async function excluirCliente(id: number) {
    const cliente = clientes.find((item) => item.id === id);

    if (!cliente) {
      return;
    }

    const confirmar = window.confirm(
      `Deseja realmente excluir o cliente "${cliente.nome}"?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      await clientesService.remover(id);
      await carregarClientes();
    } catch (error) {
      window.alert(mensagemErro(error));
    }
  }

  async function salvarCliente(cliente: {
    nome: string;
    cpf: string;
    telefone: string;
    ativo: boolean;
  }) {
    const payload = {
      nome: cliente.nome,
      cpf: soDigitos(cliente.cpf),
      telefone: cliente.telefone,
      ativo: cliente.ativo,
    };

    try {
      if (clienteEditando) {
        await clientesService.atualizar(clienteEditando.id, payload);
      } else {
        await clientesService.criar(payload);
      }

      setModalAberto(false);
      setClienteEditando(null);
      await carregarClientes();
    } catch (error) {
      window.alert(mensagemErro(error));
    }
  }

  return (
    <div className="p-8">
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

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          label="Total de clientes"
          value={resumo.total}
          icon={<UserRound size={19} />}
        />
        <InfoCard
          label="Clientes ativos"
          value={resumo.ativos}
          icon={<UserRound size={19} />}
        />
        <InfoCard
          label="Clientes inativos"
          value={resumo.inativos}
          icon={<UserRound size={19} />}
        />
        <InfoCard
          label="Veículos cadastrados"
          value={resumo.totalVeiculos}
          icon={<Car size={19} />}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Clientes cadastrados
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              {carregando
                ? "Carregando..."
                : `${totalRegistros} cliente(s) encontrado(s)`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(event) => {
                setFiltroStatus(
                  event.target.value as "todos" | "ativos" | "inativos",
                );
                setPagina(1);
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600 outline-none focus:border-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
        </div>

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
                  Veículos
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
                <th className="w-28 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                >
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
                          Cadastro {formatarData(cliente.dataCadastro)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {formatarCpf(cliente.cpf)}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {cliente.telefone}
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600">
                      <Car size={13} />
                      {cliente.quantidadeVeiculos}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusCliente ativo={cliente.ativo} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => abrirEdicao(cliente)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => void excluirCliente(cliente.id)}
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

              {!carregando && clientes.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-xs text-gray-400"
                  >
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <p className="text-[11px] text-gray-400">
            Página {pagina} de {totalPaginas}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
              disabled={pagina <= 1 || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>

            <button
              type="button"
              onClick={() =>
                setPagina((atual) => Math.min(totalPaginas, atual + 1))
              }
              disabled={pagina >= totalPaginas || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {modalAberto && (
        <ClienteModal
          cliente={clienteEditando}
          onClose={() => {
            setModalAberto(false);
            setClienteEditando(null);
          }}
          onSave={(dados) => void salvarCliente(dados)}
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
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-blue-600">{icon}</span>
      </div>
      <strong className="text-2xl font-bold text-gray-900">{value}</strong>
    </div>
  );
}

function StatusCliente({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
        ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
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
  onSave: (cliente: {
    nome: string;
    cpf: string;
    telefone: string;
    ativo: boolean;
  }) => void;
}) {
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [cpf, setCpf] = useState(
    cliente?.cpf ? formatarCpf(cliente.cpf) : "",
  );
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");
  const [ativo, setAtivo] = useState(cliente?.ativo ?? true);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nome.trim() || soDigitos(cpf).length !== 11 || !telefone.trim()) {
      window.alert("Preencha nome, CPF com 11 dígitos e telefone.");
      return;
    }

    setSalvando(true);
    await onSave({
      nome: nome.trim(),
      cpf,
      telefone: telefone.trim(),
      ativo,
    });
    setSalvando(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {cliente ? "Editar cliente" : "Novo cliente"}
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

        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Nome completo
              </label>
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Ex.: João da Silva"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(event) =>
                    setCpf(formatarCpf(event.target.value))
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
                  onChange={(event) => setTelefone(event.target.value)}
                  placeholder="(00) 00000-0000"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                value={ativo ? "ativo" : "inativo"}
                onChange={(event) =>
                  setAtivo(event.target.value === "ativo")
                }
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

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
              disabled={salvando}
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {cliente ? "Salvar alterações" : "Criar cliente"}
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
