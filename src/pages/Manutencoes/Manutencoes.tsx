import { useEffect, useRef, useState } from "react";
import { useToast, useConfirmar } from "../../hooks/useNotificacoes";
import { useCarregarLista } from "../../hooks/useCarregarLista";
import {
  AlertTriangle,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import type {
  Manutencao,
  PecaManutencao,
  StatusManutencao,
} from "../../types/manutencao";
import {
  manutencoesService,
  type ResumoManutencoes,
} from "../../services/manutencoes";
import { mensagemErro } from "../../services/api";
import { formatarData, formatarKm } from "../../utils/formatters";
import { ManutencaoModal } from "./ManutencaoModal";
import { StatusManutencaoBadge } from "./StatusManutencaoBadge";
import { InfoCard } from "../../components/ui/InfoCard";

const RESUMO_INICIAL: ResumoManutencoes = {
  total: 0,
  emDia: 0,
  proximas: 0,
  atrasadas: 0,
  veiculosMonitorados: 0,
};

export function Manutencoes() {
  const toast = useToast();
  const pedirConfirmacao = useConfirmar();
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);

  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");

  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | StatusManutencao>("todos");

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [resumo, setResumo] =
    useState<ResumoManutencoes>(RESUMO_INICIAL);

  const [modalAberto, setModalAberto] = useState(false);

  const [manutencaoEditando, setManutencaoEditando] =
    useState<Manutencao | null>(null);

  // Só volta para a página 1 quando o texto buscado de fato mudou: sem isto, o
  // timer disparado logo depois de abrir a tela jogava a pessoa de volta para
  // a página 1 se ela tivesse acabado de ir para a 2.
  const buscaAplicada = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (buscaAplicada.current === busca) return;

      buscaAplicada.current = busca;
      setBuscaDebounced(busca);
      setPagina(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [busca]);

  const { carregando, recarregar } = useCarregarLista(
    `${pagina}|${buscaDebounced}|${filtroStatus}`,
    async (ativo) => {
      try {
        const resultado = await manutencoesService.listarPaginado({
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

        setManutencoes(resultado.dados);
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

  function getVeiculo(manutencao: Manutencao) {
    return manutencao.veiculo;
  }

  function abrirNovaManutencao() {
    setManutencaoEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(manutencao: Manutencao) {
    setManutencaoEditando(manutencao);
    setModalAberto(true);
  }

  async function excluirManutencao(id: number) {
    const confirmar = await pedirConfirmacao({
      mensagem: "Deseja realmente excluir esta manutenção?",
      confirmarTexto: "Excluir",
      perigo: true,
    });

    if (!confirmar) {
      return;
    }

    try {
      await manutencoesService.remover(id);
      recarregar();
    } catch (error) {
      toast.erro(mensagemErro(error));
    }
  }

  async function salvarManutencao(dados: {
    veiculoId: number;
    tipo: string;
    descricao: string;
    valor: number | null;
    dataManutencao: string;
    quilometragem: number | null;
    proximaData: string | null;
    proximaQuilometragem: number | null;
    pecas: PecaManutencao[];
  }) {
    const payload = {
      veiculo_id: dados.veiculoId,
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: dados.valor,
      data_manutencao: dados.dataManutencao,
      quilometragem: dados.quilometragem,
      proxima_data: dados.proximaData,
      proxima_quilometragem: dados.proximaQuilometragem,
      pecas: dados.pecas,
    };

    try {
      if (manutencaoEditando) {
        await manutencoesService.atualizar(manutencaoEditando.id, payload);
      } else {
        await manutencoesService.criar(payload);
      }

      setModalAberto(false);
      setManutencaoEditando(null);
      recarregar();
    } catch (error) {
      toast.erro(mensagemErro(error));
    }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Cabeçalho */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
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
          value={resumo.emDia}
          icon={<CheckCircle2 size={19} />}
        />

        <InfoCard
          label="Próximas"
          value={resumo.proximas}
          icon={<Clock size={19} />}
        />

        <InfoCard
          label="Atrasadas"
          value={resumo.atrasadas}
          icon={<AlertTriangle size={19} />}
        />

        <InfoCard
          label="Veículos monitorados"
          value={resumo.veiculosMonitorados}
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
              {carregando
                ? "Carregando..."
                : `${totalRegistros} manutenção(ões) encontrada(s)`}
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
              onChange={(event) => {
                setFiltroStatus(
                  event.target.value as
                    | "todos"
                    | StatusManutencao,
                );
                setPagina(1);
              }}
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
          <table className="w-full tabela-cartoes">
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
              {manutencoes.map((manutencao) => {
                const veiculo = getVeiculo(manutencao);

                return (
                  <tr
                    key={manutencao.id}
                    className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                  >
                    {/* Manutenção */}
                    <td data-label="Manutenção" className="px-5 py-4">
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

                          {manutencao.pecas.length > 0 && (
                            <span
                              className="max-w-[220px] truncate text-[10px] text-gray-500"
                              title={manutencao.pecas
                                .map((peca) => peca.especificacao)
                                .join(", ")}
                            >
                              Peças:{" "}
                              {manutencao.pecas
                                .map((peca) => peca.especificacao)
                                .join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Veículo */}
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

                    {/* Cliente */}
                    <td data-label="Cliente" className="px-5 py-4 text-xs text-gray-500">
                      {veiculo?.cliente?.nome ?? "—"}
                    </td>

                    {/* Última */}
                    <td data-label="Última" className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-600">
                          {formatarData(
                            manutencao.dataManutencao,
                          )}
                        </span>

                        <span className="text-[10px] text-gray-400">
                          {formatarKm(manutencao.quilometragem)}
                        </span>
                      </div>
                    </td>

                    {/* Próxima */}
                    <td data-label="Próxima" className="px-5 py-4">
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
                    <td data-label="KM" className="px-5 py-4">
                      <span className="text-xs font-semibold text-gray-700">
                        {formatarKm(
                          manutencao.proximaQuilometragem,
                        )}
                      </span>
                    </td>

                    {/* Status */}
                    <td data-label="Situação" className="px-5 py-4">
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
                            void excluirManutencao(
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

              {!carregando && manutencoes.length === 0 && (
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

      {/* Modal */}
      {modalAberto && (
        <ManutencaoModal
          manutencao={manutencaoEditando}
          onClose={() => {
            setModalAberto(false);
            setManutencaoEditando(null);
          }}
          onSave={(dados) => void salvarManutencao(dados)}
        />
      )}
    </div>
  );
}
