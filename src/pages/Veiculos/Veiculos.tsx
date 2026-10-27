import { useEffect, useRef, useState } from "react";
import { useToast, useConfirmar } from "../../hooks/useNotificacoes";
import { useCarregarLista } from "../../hooks/useCarregarLista";
import { ErroDeLista } from "../../components/ui/ErroDeLista";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { VeiculoHistorico } from "./VeiculoHistorico";
import type { Veiculo } from "../../types/veiculo";
import { veiculosService, type ResumoVeiculos } from "../../services/veiculos";
import { mensagemErro } from "../../services/api";
import { Placa } from "../../components/veiculos/Placa";
import { formatarData, formatarMoeda } from "../../utils/formatters";
import { placaValida } from "../../utils/placa";
import { ROTULO_TIPO } from "../../utils/tipoVeiculo";
import { VeiculoModal, type DadosVeiculoForm } from "./VeiculoModal";
import { InfoCard } from "../../components/ui/InfoCard";

const RESUMO_INICIAL: ResumoVeiculos = {
  total: 0,
  clientesComVeiculo: 0,
  marcas: 0,
  anoMedio: 0,
};

export function Veiculos() {
  const toast = useToast();
  const pedirConfirmacao = useConfirmar();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [resumo, setResumo] = useState<ResumoVeiculos>(RESUMO_INICIAL);
  const [modalAberto, setModalAberto] = useState(false);
  const [veiculoEditando, setVeiculoEditando] =
    useState<Veiculo | null>(null);
  const [consultandoId, setConsultandoId] = useState<number | null>(null);
  const [veiculoHistoricoId, setVeiculoHistoricoId] =
    useState<number | null>(null);

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

  const { carregando, erro: erroDaLista, recarregar } = useCarregarLista(
    `${pagina}|${buscaDebounced}`,
    async (ativo) => {
      try {
        const resultado = await veiculosService.listarPaginado({
          pagina,
          busca: buscaDebounced,
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

        setVeiculos(resultado.dados);
        setTotalPaginas(resultado.totalPaginas);
        setTotalRegistros(resultado.totalRegistros);
        setResumo(resultado.resumo);
      } catch (error) {
        // O hook guarda a falha e a tela mostra o erro com "Tentar de novo".
        if (ativo()) {
          throw error;
        }
      }
    },
  );

  const anoMedioArredondado = Math.round(resumo.anoMedio);

  function nomeCliente(veiculo: Veiculo) {
    return veiculo.cliente?.nome ?? "Cliente não encontrado";
  }

  async function excluirVeiculo(id: number) {
    const veiculo = veiculos.find((item) => item.id === id);

    if (!veiculo) {
      return;
    }

    const confirmar = await pedirConfirmacao({

      mensagem: `Deseja realmente excluir o veículo "${veiculo.marca} ${veiculo.modelo}"?`,

      confirmarTexto: "Excluir",

      perigo: true,

    });

    if (!confirmar) {
      return;
    }

    try {
      await veiculosService.remover(id);
      toast.sucesso("Veículo excluído.");
      recarregar();
    } catch (error) {
      toast.erro(mensagemErro(error));
    }
  }

  async function consultarFipe(id: number) {
    try {
      setConsultandoId(id);
      await veiculosService.consultarFipe(id);
      recarregar();
    } catch (error) {
      toast.erro(mensagemErro(error));
    } finally {
      setConsultandoId(null);
    }
  }

  async function salvarVeiculo(payload: DadosVeiculoForm) {
    const dados = {
      cliente_id: payload.clienteId,
      tipo_veiculo: payload.tipo,
      placa: payload.placa,
      marca: payload.marca,
      modelo: payload.modelo,
      ano: payload.ano,
      ano_fabricacao: payload.anoFabricacao,
      uf: payload.uf || null,
      fipe_marca_id: payload.fipe.marcaId ? Number(payload.fipe.marcaId) : null,
      fipe_modelo_id: payload.fipe.modeloId
        ? Number(payload.fipe.modeloId)
        : null,
      fipe_ano: payload.fipe.ano || null,
    };

    try {
      if (veiculoEditando) {
        await veiculosService.atualizar(veiculoEditando.id, dados);
      } else {
        await veiculosService.criar(dados);
      }

      toast.sucesso(veiculoEditando ? "Veículo salvo." : "Veículo criado.");
      setModalAberto(false);
      setVeiculoEditando(null);
      recarregar();
    } catch (error) {
      toast.erro(mensagemErro(error));
    }
  }

  if (veiculoHistoricoId !== null) {
    return (
      <VeiculoHistorico
        veiculoId={veiculoHistoricoId}
        onVoltar={() => setVeiculoHistoricoId(null)}
      />
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[21px] font-bold text-gray-900">Veículos</h2>
          <p className="mt-1 text-xs text-gray-500">
            Cadastre e gerencie os veículos dos clientes.
          </p>
        </div>
        <button
          onClick={() => {
            setVeiculoEditando(null);
            setModalAberto(true);
          }}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Novo veículo
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Total de veículos" value={resumo.total} icon={<Car size={19} />} />
        <InfoCard label="Clientes com veículo" value={resumo.clientesComVeiculo} icon={<Car size={19} />} />
        <InfoCard label="Marcas" value={resumo.marcas} icon={<Car size={19} />} />
        <InfoCard label="Ano médio" value={anoMedioArredondado || "—"} icon={<Car size={19} />} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Veículos cadastrados
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {carregando
                ? "Carregando..."
                : erroDaLista
                  ? "Falha ao carregar."
                  : `${totalRegistros} veículo(s) encontrado(s)`}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              aria-label="Buscar veículo"
              placeholder="Buscar veículo..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {erroDaLista && (

          <ErroDeLista

            mensagem={erroDaLista}

            aoTentarDeNovo={recarregar}

          />

        )}


        <div className="overflow-x-auto">
          <table className="w-full tabela-cartoes">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Veículo
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Placa
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Cliente
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ano modelo
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Valor FIPE
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  IPVA / Licenciamento
                </th>
                <th className="w-32 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {veiculos.map((veiculo) => (
                <tr
                  key={veiculo.id}
                  className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                >
                  <td data-label="Veículo" className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Car size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {veiculo.marca} {veiculo.modelo}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          ID #{veiculo.id}
                          {veiculo.tipoVeiculo !== "carro" && ` · ${ROTULO_TIPO[veiculo.tipoVeiculo]}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td data-label="Placa" className="px-5 py-4">
                    <Placa placa={veiculo.placa} uf={veiculo.uf} />
                    {!placaValida(veiculo.placa) && (
                      <p className="mt-1 text-xs font-semibold text-red-600">
                        Placa fora do padrão: corrija em editar.
                      </p>
                    )}
                  </td>
                  <td data-label="Cliente" className="px-5 py-4 text-xs text-gray-500">
                    {nomeCliente(veiculo)}
                  </td>
                  <td data-label="Ano modelo" className="px-5 py-4 text-xs text-gray-500">
                    {veiculo.anoCompleto}
                  </td>
                  <td data-label="Valor FIPE" className="px-5 py-4">
                    {veiculo.fipeValor !== null ? (
                      <>
                        <p className="text-xs font-semibold text-gray-900">
                          {formatarMoeda(veiculo.fipeValor)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          em {formatarData(veiculo.fipeConsultadoEm)}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>
                  <td data-label="IPVA / Licenciamento" className="px-5 py-4">
                    {veiculo.uf || veiculo.isentoIpva ? (
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>
                          IPVA{" "}
                          <span
                            className={`font-semibold ${
                              veiculo.isentoIpva ? "text-emerald-700" : "text-gray-900"
                            }`}
                          >
                            {veiculo.isentoIpva
                              ? "Isento (mais de 20 anos)"
                              : veiculo.ipvaEstimado !== null
                                ? `≈ ${formatarMoeda(veiculo.ipvaEstimado)}`
                                : "—"}
                          </span>
                          {veiculo.ipvaAliquotaMedia && veiculo.ipvaEstimado !== null && (
                            <span className="ml-1 text-xs text-amber-600">
                              (alíquota média)
                            </span>
                          )}
                        </p>
                        {veiculo.possivelIsencaoIpva && (
                          <p className="text-xs text-amber-600">
                            Carro com 15 a 20 anos: alguns estados isentam o IPVA. Confira na Sefaz.
                          </p>
                        )}
                        <p>
                          Lic.{" "}
                          <span className="font-semibold text-gray-900">
                            {veiculo.licenciamentoValor !== null
                              ? formatarMoeda(veiculo.licenciamentoValor)
                              : "—"}
                          </span>{" "}
                          <span className="text-gray-500">({veiculo.uf})</span>
                        </p>
                        {veiculo.proximoVencimentoLicenciamento && (
                          <p
                            className={
                              new Date(veiculo.proximoVencimentoLicenciamento) < new Date()
                                ? "font-semibold text-red-600"
                                : "text-gray-500"
                            }
                            title="Estimativa com base no final da placa. Confirme no Detran do seu estado."
                          >
                            Vence (est.) {formatarData(veiculo.proximoVencimentoLicenciamento)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Informe o estado
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {veiculo.fipeMarcaId &&
                        veiculo.fipeModeloId &&
                        veiculo.fipeAno && (
                          <button
                            onClick={() => void consultarFipe(veiculo.id)}
                            disabled={consultandoId === veiculo.id}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                            title="Consultar valor na FIPE"
                            aria-label={`Consultar valor na FIPE de ${veiculo.marca} ${veiculo.modelo}`}
                          >
                            <RefreshCw
                              size={15}
                              className={
                                consultandoId === veiculo.id
                                  ? "animate-spin"
                                  : ""
                              }
                            />
                          </button>
                        )}
                      <button
                        onClick={() => setVeiculoHistoricoId(veiculo.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600"
                        title="Ver histórico"
                        aria-label={`Ver histórico de ${veiculo.marca} ${veiculo.modelo}`}
                      >
                        <Clock size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setVeiculoEditando(veiculo);
                          setModalAberto(true);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                        title="Editar"
                        aria-label={`Editar ${veiculo.marca} ${veiculo.modelo}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => void excluirVeiculo(veiculo.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                        title="Excluir"
                        aria-label={`Excluir ${veiculo.marca} ${veiculo.modelo}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!carregando && !erroDaLista && veiculos.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-xs text-gray-500"
                  >
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <p className="text-xs text-gray-500">
            Página {pagina} de {totalPaginas}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
              disabled={pagina <= 1 || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

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
