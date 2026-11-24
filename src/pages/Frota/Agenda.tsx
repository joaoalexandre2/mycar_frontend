import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, FileUp, Plus } from "lucide-react";
import { contaService } from "../../services/conta";
import { centrosCustoService, motoristasService, usosService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { usePodeNaFrota, useUsuarioDaFrota } from "../../hooks/usePodeNaFrota";
import { UsoFormModal } from "../../components/frota/UsoFormModal";
import { UsoDetalheModal } from "../../components/frota/UsoDetalheModal";
import { ImportarPlanilhaModal } from "../../components/frota/ImportarPlanilhaModal";
import { Modal } from "../../components/ui/Modal";
import { Alert } from "../../components/ui/Alert";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { CLASSES_DO_TOM } from "../../components/ui/tons";
import { TITULO_DE_SECAO, TITULO_DE_SUBSECAO } from "../../components/ui/escalaDeTitulos";
import { TOM_DO_STATUS_USO } from "../../components/frota/tomDoStatusUso";
import {
  descreverJanela,
  diasDoCalendario,
  horaDe,
  mesVizinho,
  ocupaAAgenda,
  paraCampoDeHorario,
  periodoDaGrade,
  rotuloDoMes,
  usosDoDia,
} from "../../utils/agenda";
import { ROTULO_STATUS_USO, type CentroCusto, type Motorista, type UsoVeiculo } from "../../types/frota";
import type { VeiculoConta } from "../../types/conta";
import { classeDoCampoEmLinha, classeDoRotulo } from "../../components/ui/Campo";

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const POR_DIA_NO_CALENDARIO = 3;

/** Texto curto de um uso dentro do calendário: hora, placa e quem vai usar. */
const resumoDoUso = (uso: UsoVeiculo) =>
  [horaDe(uso.inicioPrevisto), uso.veiculo?.placa, uso.motorista].filter(Boolean).join(" · ");

/**
 * Tudo o que o chip do calendário diz, para o leitor de tela e para quem passa o
 * mouse (o texto visível corta). Começa pelo mesmo resumo que se vê no chip.
 */
const descricaoDoUso = (uso: UsoVeiculo) =>
  [
    horaDe(uso.inicioPrevisto),
    uso.veiculo?.placa,
    uso.motorista ?? "sem motorista",
    ROTULO_STATUS_USO[uso.status],
    descreverJanela(uso.inicioPrevisto, uso.fimPrevisto),
  ]
    .filter(Boolean)
    .join(" · ");

/** "10/11/2026" */
const dataCompleta = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}`;

/** Cores do status do uso (o cancelado vai riscado). */
const corDoUso = (uso: UsoVeiculo) =>
  `${CLASSES_DO_TOM[TOM_DO_STATUS_USO[uso.status]]}${uso.status === "cancelado" ? " line-through" : ""}`;

/** Um uso na lista por dia (celular e "+N mais"): placa, motorista, janela e status por escrito. */
function BotaoDoUso({ uso, onAbrir }: { uso: UsoVeiculo; onAbrir: (uso: UsoVeiculo) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(uso)}
      data-tom={TOM_DO_STATUS_USO[uso.status]}
      className={`block min-h-11 w-full rounded-lg border px-3 py-2 text-left text-sm ${corDoUso(uso)}`}
    >
      <span className="font-semibold">
        {uso.veiculo?.placa} · {uso.motorista ?? "sem motorista"}
      </span>
      <span className="block">
        {descreverJanela(uso.inicioPrevisto, uso.fimPrevisto)} · {ROTULO_STATUS_USO[uso.status]}
      </span>
    </button>
  );
}

/** Agenda da frota: quem vai usar qual veículo e quando. */
export function Agenda() {
  const hoje = useMemo(() => paraCampoDeHorario(new Date()).slice(0, 10), []);
  const [{ ano, mes }, setMes] = useState(() => ({
    ano: Number(hoje.slice(0, 4)),
    mes: Number(hoje.slice(5, 7)),
  }));

  const pode = usePodeNaFrota();
  const usuario = useUsuarioDaFrota();
  // Motorista não lista motoristas nem centros: a reserva dele sai no centro que o gestor amarrou.
  const podeMotoristas = pode("motoristas");
  const podeCentros = pode("centros_custo");
  const souMotorista = usuario?.papel === "motorista";

  const [veiculos, setVeiculos] = useState<VeiculoConta[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [centros, setCentros] = useState<CentroCusto[]>([]);
  const [cadastrosCarregados, setCadastrosCarregados] = useState(false);
  const [usos, setUsos] = useState<UsoVeiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [filtroMotorista, setFiltroMotorista] = useState("");
  const [recarregar, setRecarregar] = useState(0);

  const [formulario, setFormulario] = useState<{ uso: UsoVeiculo | null; dia?: string } | null>(null);
  const [aberto, setAberto] = useState<UsoVeiculo | null>(null);
  const [importando, setImportando] = useState(false);
  /** Dia aberto pelo "+N mais": a lista completa dele. */
  const [diaAberto, setDiaAberto] = useState<string | null>(null);
  /** Dia do seletor da lista do celular (onde os dias livres não aparecem). */
  const [diaEscolhido, setDiaEscolhido] = useState(hoje);
  const idBase = useId();
  const calendario = useRef<HTMLDivElement>(null);
  /** O "+N mais" que abriu a lista do dia. */
  const gatilhoDoDia = useRef<HTMLElement | null>(null);
  /**
   * Para onde o foco volta quando o detalhe (ou a edição) aberto pela lista do dia fecha.
   *
   * O modal devolve o foco a quem estava focado quando ele abriu. Do "Usos do dia" para o
   * detalhe, isso só dava certo porque o React desmonta a lista antes de montar o detalhe
   * (o foco passava pelo "+N mais" no meio). Se o "+N mais" some enquanto o detalhe está
   * aberto (excluir um uso deixa o dia com 3 ou menos), o foco caía no <body>. Aqui a Agenda
   * guarda o gatilho e, se ele não existir mais, usa o primeiro botão do mesmo dia.
   */
  const retornoDoDetalhe = useRef<{ botao: HTMLElement | null; dia: string } | null>(null);

  useEffect(() => {
    let ativo = true;

    Promise.all([
      contaService.listarTodosVeiculos(),
      podeMotoristas ? motoristasService.listar() : Promise.resolve<Motorista[]>([]),
      podeCentros ? centrosCustoService.listar() : Promise.resolve<CentroCusto[]>([]),
    ])
      .then(([v, m, c]) => {
        if (!ativo) return;
        setVeiculos(v);
        setMotoristas(m);
        setCentros(c);
        setCadastrosCarregados(true);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [recarregar, podeMotoristas, podeCentros]);

  useEffect(() => {
    let ativo = true;
    const { de, ate } = periodoDaGrade(ano, mes);

    usosService
      .listar({
        de,
        ate,
        veiculoId: filtroVeiculo ? Number(filtroVeiculo) : undefined,
        motoristaId: filtroMotorista ? Number(filtroMotorista) : undefined,
      })
      .then((lista) => {
        if (!ativo) return;
        setUsos(lista);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [ano, mes, filtroVeiculo, filtroMotorista, recarregar]);

  // Roda depois da limpeza do modal que fechou (efeito do pai, no mesmo commit), então decide por último.
  useEffect(() => {
    const retorno = retornoDoDetalhe.current;
    if (!retorno || aberto || formulario || diaAberto) return;

    retornoDoDetalhe.current = null;

    const alvo = retorno.botao?.isConnected
      ? retorno.botao
      : calendario.current?.querySelector<HTMLElement>(`[data-dia="${retorno.dia}"] button:not([disabled])`);

    alvo?.focus();
  }, [aberto, formulario, diaAberto]);

  const dias = useMemo(() => diasDoCalendario(ano, mes), [ano, mes]);
  const diasDoMes = useMemo(() => dias.filter((d) => d.doMes), [dias]);

  function mudarMes(passo: 1 | -1) {
    setCarregando(true);
    setMes(mesVizinho(ano, mes, passo));
  }

  const irParaHoje = () => {
    setCarregando(true);
    setMes({ ano: Number(hoje.slice(0, 4)), mes: Number(hoje.slice(5, 7)) });
  };

  /** Troca o uso na lista (sem pedir tudo de novo) depois de uma alteração. */
  const atualizarNaLista = useCallback((uso: UsoVeiculo) => {
    setUsos((lista) => lista.map((u) => (u.id === uso.id ? uso : u)));
    setAberto(uso);
  }, []);

  function tentarDeNovo() {
    setErro(null);
    setCarregando(true);
    setRecarregar((n) => n + 1);
  }

  const reservarNoDia = (dia: string) => setFormulario({ uso: null, dia });

  const totalNoMes = usos.filter(ocupaAAgenda).length;
  const semVeiculos = cadastrosCarregados && veiculos.length === 0;

  return (
    <div className="space-y-6 p-4 sm:p-8">
      {/* O título e o subtítulo da tela ficam só no cabeçalho (h1); repetir aqui
          fazia o leitor de tela ler o mesmo título duas vezes. */}
      <div className="flex flex-wrap items-end justify-end gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportando(true)}
            className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 md:h-10"
          >
            <FileUp size={15} /> Importar planilha
          </button>
          <button
            type="button"
            onClick={() => setFormulario({ uso: null })}
            disabled={semVeiculos}
            className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 md:h-10"
          >
            <Plus size={15} /> Reservar veículo
          </button>
        </div>
      </div>

      {semVeiculos && (
        <Alert tone="warning">
          Cadastre os veículos da frota em{" "}
          <Link to="/veiculos" className="font-semibold underline">
            Veículos da frota
          </Link>{" "}
          para poder reservá-los.
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => mudarMes(-1)}
            aria-label="Mês anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => mudarMes(1)}
            aria-label="Próximo mês"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={irParaHoje}
            className="ml-1 h-11 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 md:h-9"
          >
            Hoje
          </button>
        </div>

        <h2 className={`${TITULO_DE_SECAO} capitalize md:min-w-40`}>{rotuloDoMes(ano, mes)}</h2>

        <div className="ml-auto flex flex-wrap gap-2">
          <select
            value={filtroVeiculo}
            onChange={(e) => {
              setCarregando(true);
              setFiltroVeiculo(e.target.value);
            }}
            aria-label="Filtrar por veículo"
            className={classeDoCampoEmLinha}
          >
            <option value="">Todos os veículos</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa}
              </option>
            ))}
          </select>
          <select
            value={filtroMotorista}
            onChange={(e) => {
              setCarregando(true);
              setFiltroMotorista(e.target.value);
            }}
            aria-label="Filtrar por motorista"
            className={classeDoCampoEmLinha}
          >
            <option value="">Todos os motoristas</option>
            {motoristas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {erro && (
        <Alert tone="danger" action={{ label: "Tentar de novo", onClick: tentarDeNovo }}>
          {erro}
        </Alert>
      )}

      {/* Visível e anunciado (o aria-busy sozinho não dizia nada a quem vê a tela nem à lista do celular). */}
      {carregando && !erro && <Carregando />}

      {/* Calendário (a partir de lg: no tablet as 7 colunas ficavam estreitas
          demais para ler os usos; ele usa a lista por dia) */}
      <div ref={calendario} className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white lg:block" aria-busy={carregando}>
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-bold tracking-wide text-gray-500 uppercase">
          {SEMANA.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7" role="grid" aria-label={`Calendário de ${rotuloDoMes(ano, mes)}`}>
          {dias.map((dia) => {
            const doDia = usosDoDia(usos, dia.data);

            return (
              <div
                key={dia.data}
                role="gridcell"
                data-dia={dia.data}
                className={`min-h-28 border-r border-b border-gray-100 p-1.5 ${dia.doMes ? "bg-white" : "bg-gray-50/60"}`}
              >
                <button
                  type="button"
                  onClick={() => reservarNoDia(dia.data)}
                  disabled={semVeiculos}
                  title="Reservar neste dia"
                  aria-label={`Reservar em ${dia.data.slice(8, 10)}/${dia.data.slice(5, 7)}/${dia.data.slice(0, 4)}`}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold hover:bg-blue-50 disabled:cursor-default ${
                    dia.data === hoje
                      ? "bg-blue-600 text-white hover:bg-blue-600"
                      : dia.doMes
                        ? "text-gray-700"
                        : "text-gray-500"
                  }`}
                >
                  {Number(dia.data.slice(8, 10))}
                </button>

                <div className="mt-1 space-y-1">
                  {doDia.slice(0, POR_DIA_NO_CALENDARIO).map((uso) => (
                    <button
                      key={uso.id}
                      type="button"
                      onClick={() => setAberto(uso)}
                      aria-label={descricaoDoUso(uso)}
                      title={descricaoDoUso(uso)}
                      data-tom={TOM_DO_STATUS_USO[uso.status]}
                      className={`block w-full rounded-md border px-1.5 py-0.5 text-left text-xs font-medium ${corDoUso(uso)}`}
                    >
                      {/* O status vai por escrito, não só na cor. */}
                      <span className="block truncate">{resumoDoUso(uso)}</span>
                      <span className="block truncate font-bold">{ROTULO_STATUS_USO[uso.status]}</span>
                    </button>
                  ))}
                  {doDia.length > POR_DIA_NO_CALENDARIO && (
                    <button
                      type="button"
                      onClick={(evento) => {
                        gatilhoDoDia.current = evento.currentTarget;
                        setDiaAberto(dia.data);
                      }}
                      aria-label={`+${doDia.length - POR_DIA_NO_CALENDARIO} mais: ver os ${doDia.length} usos de ${dataCompleta(dia.data)}`}
                      className="px-1 text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                      +{doDia.length - POR_DIA_NO_CALENDARIO} mais
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista por dia (celular e tablet) */}
      <div className="space-y-3 lg:hidden">
        {/* Aqui só aparecem os dias com uso: o seletor deixa reservar num dia livre
            sem ir ao botão do topo e trocar a data no formulário. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (diaEscolhido) reservarNoDia(diaEscolhido);
          }}
          className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-3"
        >
          <div className="min-w-40 flex-1">
            <label htmlFor={`${idBase}-dia`} className={classeDoRotulo}>
              Reservar em outro dia
            </label>
            <input
              id={`${idBase}-dia`}
              type="date"
              value={diaEscolhido}
              onChange={(e) => setDiaEscolhido(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-base text-gray-700 outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={semVeiculos || !diaEscolhido}
            className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Plus size={15} aria-hidden="true" /> Reservar no dia escolhido
          </button>
        </form>

        {diasDoMes.map((dia) => {
          const doDia = usosDoDia(usos, dia.data);

          if (doDia.length === 0) return null;

          const idTitulo = `${idBase}-${dia.data}`;

          return (
            <section key={dia.data} aria-labelledby={idTitulo} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 id={idTitulo} className={TITULO_DE_SUBSECAO}>
                  {dia.data.slice(8, 10)}/{dia.data.slice(5, 7)}
                  {dia.data === hoje && <span className="ml-2 text-blue-600">hoje</span>}
                </h3>
                <button
                  type="button"
                  onClick={() => reservarNoDia(dia.data)}
                  disabled={semVeiculos}
                  aria-describedby={idTitulo}
                  className="flex h-11 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  <Plus size={14} aria-hidden="true" /> Reservar neste dia
                </button>
              </div>
              <ul className="space-y-1.5">
                {doDia.map((uso) => (
                  <li key={uso.id}>
                    <BotaoDoUso uso={uso} onAbrir={setAberto} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {!carregando && totalNoMes === 0 && !erro && (
        <EstadoVazio
          titulo={
            <>
              Nenhum uso agendado neste período.
              {/* O motorista só recebe as reservas dele: a agenda vazia não quer dizer frota livre. */}
              {souMotorista && " Você vê só as suas reservas."}
            </>
          }
          acao={
            !semVeiculos && (
              <button
                type="button"
                onClick={() => setFormulario({ uso: null })}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 md:h-10"
              >
                <Plus size={15} aria-hidden="true" /> Reservar veículo
              </button>
            )
          }
        />
      )}

      {formulario && (
        <UsoFormModal
          uso={formulario.uso}
          diaInicial={formulario.dia}
          veiculos={veiculos}
          motoristas={motoristas}
          centros={centros}
          modoMotorista={souMotorista ? { centro: usuario?.centro_do_motorista ?? null } : null}
          onSalvo={() => {
            setFormulario(null);
            setAberto(null);
            setRecarregar((n) => n + 1);
          }}
          onClose={() => setFormulario(null)}
        />
      )}

      {diaAberto && (
        <Modal titulo={`Usos de ${dataCompleta(diaAberto)}`} onClose={() => setDiaAberto(null)} larguraMax="max-w-md">
          <div className="space-y-3 px-6 py-5">
            <ul className="space-y-1.5">
              {usosDoDia(usos, diaAberto).map((uso) => (
                <li key={uso.id}>
                  <BotaoDoUso
                    uso={uso}
                    onAbrir={(u) => {
                      retornoDoDetalhe.current = { botao: gatilhoDoDia.current, dia: diaAberto };
                      setDiaAberto(null);
                      setAberto(u);
                    }}
                  />
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setDiaAberto(null);
                reservarNoDia(diaAberto);
              }}
              disabled={semVeiculos}
              className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 md:h-10"
            >
              <Plus size={15} aria-hidden="true" /> Reservar neste dia
            </button>
          </div>
        </Modal>
      )}

      {aberto && !formulario && (
        <UsoDetalheModal
          uso={aberto}
          onAtualizado={atualizarNaLista}
          onRemovido={(id) => {
            setUsos((lista) => lista.filter((u) => u.id !== id));
            setAberto(null);
          }}
          onEditar={(uso) => setFormulario({ uso })}
          onClose={() => setAberto(null)}
        />
      )}

      {importando && (
        <ImportarPlanilhaModal
          onImportado={() => setRecarregar((n) => n + 1)}
          onClose={() => setImportando(false)}
        />
      )}
    </div>
  );
}
