import { useEffect, useState } from "react";
import { useToast, useConfirmar } from "../../hooks/useNotificacoes";
import { useCarregarLista } from "../../hooks/useCarregarLista";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  Car,
} from "lucide-react";
import type { Cliente } from "../../types/cliente";
import { clientesService, type ResumoClientes } from "../../services/clientes";
import { mensagemErro } from "../../services/api";
import { formatarCpf, formatarData, soDigitos } from "../../utils/formatters";
import { ClienteModal } from "./ClienteModal";
import { InfoCard } from "../../components/ui/InfoCard";

const RESUMO_INICIAL: ResumoClientes = {
  total: 0,
  ativos: 0,
  inativos: 0,
  totalVeiculos: 0,
};

export function Clientes() {
  const toast = useToast();
  const pedirConfirmacao = useConfirmar();
  const [clientes, setClientes] = useState<Cliente[]>([]);
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

  const { carregando, recarregar } = useCarregarLista(
    `${pagina}|${buscaDebounced}|${filtroStatus}`,
    async (ativo) => {
      try {
        const resultado = await clientesService.listarPaginado({
          pagina,
          busca: buscaDebounced,
          status: filtroStatus,
        });

        // Busca antiga (a tela já mudou de página/filtro): descarta.
        if (!ativo()) {
          return;
        }

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
        if (ativo()) {
          toast.erro(mensagemErro(error));
        }
      }
    },
  );

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

    const confirmar = await pedirConfirmacao({

      mensagem: `Deseja realmente excluir o cliente "${cliente.nome}"?`,

      confirmarTexto: "Excluir",

      perigo: true,

    });

    if (!confirmar) {
      return;
    }

    try {
      await clientesService.remover(id);
      recarregar();
    } catch (error) {
      toast.erro(mensagemErro(error));
    }
  }

  async function salvarCliente(cliente: {
    nome: string;
    cpf: string;
    telefone: string;
    email: string;
    ativo: boolean;
  }) {
    const payload = {
      nome: cliente.nome,
      cpf: soDigitos(cliente.cpf),
      telefone: cliente.telefone,
      email: cliente.email.trim() || null,
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
      recarregar();
    } catch (error) {
      toast.erro(mensagemErro(error));
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
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
          <table className="w-full tabela-cartoes">
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
                  <td data-label="Cliente" className="px-5 py-4">
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
                  <td data-label="CPF" className="px-5 py-4 text-xs text-gray-500">
                    {formatarCpf(cliente.cpf)}
                  </td>
                  <td data-label="Telefone" className="px-5 py-4 text-xs text-gray-500">
                    {cliente.telefone}
                  </td>
                  <td data-label="Veículos" className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-semibold text-gray-600">
                      <Car size={13} />
                      {cliente.quantidadeVeiculos}
                    </span>
                  </td>
                  <td data-label="Status" className="px-5 py-4">
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

function obterIniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}
