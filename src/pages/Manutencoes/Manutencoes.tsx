import { useEffect, useState } from "react";
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
  X,
} from "lucide-react";
import type { Manutencao, StatusManutencao } from "../../types/manutencao";
import type { Veiculo } from "../../types/veiculo";
import {
  manutencoesService,
  type ResumoManutencoes,
} from "../../services/manutencoes";
import { veiculosService } from "../../services/veiculos";
import { mensagemErro } from "../../services/api";
import { formatarData, formatarKm, hojeISO } from "../../utils/formatters";

const RESUMO_INICIAL: ResumoManutencoes = {
  total: 0,
  emDia: 0,
  proximas: 0,
  atrasadas: 0,
  veiculosMonitorados: 0,
};

export function Manutencoes() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
      setPagina(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [busca]);

  async function carregar() {
    try {
      setCarregando(true);
      const [resultado, listaVeiculos] = await Promise.all([
        manutencoesService.listarPaginado({
          pagina,
          busca: buscaDebounced,
          status: filtroStatus,
        }),
        veiculosService.listar(),
      ]);

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
      setVeiculos(listaVeiculos);
    } catch (error) {
      window.alert(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, buscaDebounced, filtroStatus]);

  function getVeiculo(manutencao: Manutencao) {
    return (
      manutencao.veiculo ??
      veiculos.find((veiculo) => veiculo.id === manutencao.veiculoId)
    );
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
    const confirmar = window.confirm(
      "Deseja realmente excluir esta manutenção?",
    );

    if (!confirmar) {
      return;
    }

    try {
      await manutencoesService.remover(id);
      await carregar();
    } catch (error) {
      window.alert(mensagemErro(error));
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
    };

    try {
      if (manutencaoEditando) {
        await manutencoesService.atualizar(manutencaoEditando.id, payload);
      } else {
        await manutencoesService.criar(payload);
      }

      setModalAberto(false);
      setManutencaoEditando(null);
      await carregar();
    } catch (error) {
      window.alert(mensagemErro(error));
    }
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
              {manutencoes.map((manutencao) => {
                const veiculo = getVeiculo(manutencao);

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
                      {veiculo?.cliente?.nome ?? "—"}
                    </td>

                    {/* Última */}
                    <td className="px-5 py-4">
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
                          manutencao.proximaQuilometragem,
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
          veiculos={veiculos}
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
  veiculos,
  onClose,
  onSave,
}: {
  manutencao: Manutencao | null;
  veiculos: Veiculo[];
  onClose: () => void;
  onSave: (dados: {
    veiculoId: number;
    tipo: string;
    descricao: string;
    valor: number | null;
    dataManutencao: string;
    quilometragem: number | null;
    proximaData: string | null;
    proximaQuilometragem: number | null;
  }) => void;
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

  const [dataManutencao, setDataManutencao] = useState(
    manutencao?.dataManutencao ?? hojeISO(),
  );

  const [proximaData, setProximaData] = useState(
    manutencao?.proximaData ?? "",
  );

  const [quilometragem, setQuilometragem] = useState(
    manutencao?.quilometragem?.toString() ?? "",
  );

  const [proximaQuilometragem, setProximaQuilometragem] = useState(
    manutencao?.proximaQuilometragem?.toString() ?? "",
  );

  const [valor, setValor] = useState(
    manutencao?.valor?.toString() ?? "",
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!veiculoId || !tipo.trim() || !descricao.trim() || !dataManutencao) {
      window.alert(
        "Preencha veículo, tipo, descrição e data da manutenção.",
      );

      return;
    }

    const quilometragemNumerica =
      quilometragem === "" ? null : Number(quilometragem);

    const proximaQuilometragemNumerica =
      proximaQuilometragem === "" ? null : Number(proximaQuilometragem);

    const valorNumerico = valor === "" ? null : Number(valor);

    if (
      (quilometragemNumerica !== null &&
        (Number.isNaN(quilometragemNumerica) || quilometragemNumerica < 0)) ||
      (proximaQuilometragemNumerica !== null &&
        (Number.isNaN(proximaQuilometragemNumerica) ||
          proximaQuilometragemNumerica < 0)) ||
      (valorNumerico !== null &&
        (Number.isNaN(valorNumerico) || valorNumerico < 0))
    ) {
      window.alert("Informe valores numéricos válidos.");

      return;
    }

    onSave({
      veiculoId: Number(veiculoId),
      tipo: tipo.trim(),
      descricao: descricao.trim(),
      valor: valorNumerico,
      dataManutencao,
      quilometragem: quilometragemNumerica,
      proximaData: proximaData || null,
      proximaQuilometragem: proximaQuilometragemNumerica,
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

                {veiculos.map((veiculo) => (
                  <option
                    key={veiculo.id}
                    value={veiculo.id}
                  >
                    {veiculo.marca} {veiculo.modelo} -{" "}
                    {veiculo.placa}
                    {veiculo.cliente ? ` - ${veiculo.cliente.nome}` : ""}
                  </option>
                ))}
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

            {/* Valor */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Valor (opcional)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                placeholder="Ex.: 250.00"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Data da manutenção
                </label>

                <input
                  type="date"
                  value={dataManutencao}
                  onChange={(event) =>
                    setDataManutencao(event.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Próxima manutenção (opcional)
                </label>

                <input
                  type="date"
                  value={proximaData}
                  onChange={(event) =>
                    setProximaData(event.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* KM */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  KM atual (opcional)
                </label>

                <input
                  type="number"
                  min="0"
                  value={quilometragem}
                  onChange={(event) =>
                    setQuilometragem(event.target.value)
                  }
                  placeholder="Ex.: 50000"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Próxima KM (opcional)
                </label>

                <input
                  type="number"
                  min="0"
                  value={proximaQuilometragem}
                  onChange={(event) =>
                    setProximaQuilometragem(event.target.value)
                  }
                  placeholder="Ex.: 60000"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                />
              </div>
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
