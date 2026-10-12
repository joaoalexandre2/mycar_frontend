import { useEffect, useState } from "react";
import { useToast, useConfirmar } from "../../hooks/useNotificacoes";
import { useCarregarLista } from "../../hooks/useCarregarLista";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { OrdemServicoDetalhes } from "./OrdemServicoDetalhes";
import type {
  OrdemServico,
  StatusOrdemServico,
} from "../../types/ordemServico";
import {
  ordensServicoService,
  type ResumoOrdensServico,
} from "../../services/ordensServico";
import { mensagemErro } from "../../services/api";
import { formatarData, formatarMoeda } from "../../utils/formatters";
import { OrdemServicoModal } from "./OrdemServicoModal";
import { InfoCard } from "../../components/ui/InfoCard";

const STATUS_LABEL: Record<StatusOrdemServico, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  aguardando_peca: "Aguardando peça",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const RESUMO_INICIAL: ResumoOrdensServico = {
  total: 0,
  abertas: 0,
  emAndamento: 0,
  finalizadas: 0,
  valorTotal: 0,
};

export function OrdensServico() {
  const toast = useToast();
  const pedirConfirmacao = useConfirmar();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [ordemSelecionada, setOrdemSelecionada] =
    useState<OrdemServico | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [resumo, setResumo] = useState<ResumoOrdensServico>(RESUMO_INICIAL);
  const [modalAberto, setModalAberto] = useState(false);
  const [ordemEditando, setOrdemEditando] = useState<OrdemServico | null>(null);

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
        const resultado = await ordensServicoService.listarPaginado({
          pagina,
          busca: buscaDebounced,
          status: filtroStatus as "todos" | StatusOrdemServico,
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

        setOrdens(resultado.dados);
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

  async function abrirDetalhes(ordem: OrdemServico) {
    try {
      const detalhe = await ordensServicoService.buscar(ordem.id);
      setOrdemSelecionada(detalhe);
    } catch (error) {
      toast.erro(mensagemErro(error));
    }
  }

  async function excluirOrdem(id: number) {
    const confirmar = await pedirConfirmacao({
      mensagem: "Deseja realmente excluir esta ordem de serviço?",
      confirmarTexto: "Excluir",
      perigo: true,
    });

    if (!confirmar) {
      return;
    }

    try {
      await ordensServicoService.remover(id);
      if (ordemSelecionada?.id === id) {
        setOrdemSelecionada(null);
      }
      recarregar();
    } catch (error) {
      toast.erro(mensagemErro(error));
    }
  }

  async function salvarOrdem(dados: {
    veiculoId: number;
    descricao: string;
    status: StatusOrdemServico;
    valor: number;
    dataAbertura: string;
  }) {
    try {
      if (ordemEditando) {
        await ordensServicoService.atualizar(ordemEditando.id, {
          veiculo_id: dados.veiculoId,
          descricao: dados.descricao,
          status: dados.status,
          valor: dados.valor,
          data_abertura: dados.dataAbertura,
        });
      } else {
        await ordensServicoService.criar({
          veiculo_id: dados.veiculoId,
          descricao: dados.descricao,
          valor: dados.valor,
          data_abertura: dados.dataAbertura,
        });
      }

      setModalAberto(false);
      setOrdemEditando(null);
      recarregar();
    } catch (error) {
      toast.erro(mensagemErro(error));
    }
  }

  if (ordemSelecionada) {
    return (
      <OrdemServicoDetalhes
        ordem={ordemSelecionada}
        onVoltar={() => setOrdemSelecionada(null)}
      />
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[21px] font-bold text-gray-900">
            Ordens de serviço
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Acompanhe e gerencie os serviços dos veículos.
          </p>
        </div>
        <button
          onClick={() => {
            setOrdemEditando(null);
            setModalAberto(true);
          }}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Nova ordem
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoCard label="Ordens abertas" value={resumo.abertas} icon={<ClipboardList size={19} />} />
        <InfoCard label="Em andamento" value={resumo.emAndamento} icon={<ClipboardList size={19} />} />
        <InfoCard label="Finalizadas" value={resumo.finalizadas} icon={<ClipboardList size={19} />} />
        <InfoCard
          label="Valor das ordens"
          value={formatarMoeda(resumo.valorTotal)}
          icon={<ClipboardList size={19} />}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Ordens cadastradas
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              {carregando
                ? "Carregando..."
                : `${totalRegistros} ordem(ns) encontrada(s)`}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative w-72">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar ordem..."
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:bg-white"
              />
            </div>
            <select
              value={filtroStatus}
              onChange={(event) => {
                setFiltroStatus(event.target.value);
                setPagina(1);
              }}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-600 outline-none focus:border-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="aberta">Aberta</option>
              <option value="em_andamento">Em andamento</option>
              <option value="aguardando_peca">Aguardando peça</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full tabela-cartoes">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">OS</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">Veículo</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">Cliente</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">Descrição</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">Data</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">Valor</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="w-28 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {ordens.map((ordem) => {
                const veiculo = ordem.veiculo;

                return (
                  <tr
                    key={ordem.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td data-label="OS" className="px-5 py-4">
                      <button
                        onClick={() => void abrirDetalhes(ordem)}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        #{String(ordem.id).padStart(4, "0")}
                      </button>
                    </td>
                    <td data-label="Veículo" className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-900">
                          {veiculo?.marca} {veiculo?.modelo}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {veiculo?.placa}
                        </span>
                      </div>
                    </td>
                    <td data-label="Cliente" className="px-5 py-4 text-xs text-gray-500">
                      {veiculo?.cliente?.nome ?? "—"}
                    </td>
                    <td data-label="Descrição" className="max-w-[280px] px-5 py-4">
                      <span className="block truncate text-xs text-gray-500">
                        {ordem.descricao}
                      </span>
                    </td>
                    <td data-label="Data" className="px-5 py-4 text-xs text-gray-500">
                      {formatarData(ordem.dataAbertura)}
                    </td>
                    <td data-label="Valor" className="px-5 py-4 text-xs font-semibold text-gray-700">
                      {formatarMoeda(ordem.valor)}
                    </td>
                    <td data-label="Status" className="px-5 py-4">
                      <Status status={ordem.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setOrdemEditando(ordem);
                            setModalAberto(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => void excluirOrdem(ordem.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!carregando && ordens.length === 0 && (
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
        <OrdemServicoModal
          ordem={ordemEditando}
          onClose={() => {
            setModalAberto(false);
            setOrdemEditando(null);
          }}
          onSave={(dados) => void salvarOrdem(dados)}
        />
      )}
    </div>
  );
}

function Status({ status }: { status: StatusOrdemServico }) {
  const className = {
    aberta: "bg-blue-100 text-blue-700",
    em_andamento: "bg-yellow-100 text-yellow-700",
    aguardando_peca: "bg-orange-100 text-orange-700",
    finalizada: "bg-green-100 text-green-700",
    cancelada: "bg-red-100 text-red-700",
  }[status];

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${className}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
