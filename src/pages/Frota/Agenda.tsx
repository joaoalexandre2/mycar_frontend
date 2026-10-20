import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, FileUp, Plus } from "lucide-react";
import { contaService } from "../../services/conta";
import { centrosCustoService, motoristasService, usosService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { UsoFormModal } from "../../components/frota/UsoFormModal";
import { UsoDetalheModal } from "../../components/frota/UsoDetalheModal";
import { ImportarPlanilhaModal } from "../../components/frota/ImportarPlanilhaModal";
import {
  COR_DO_STATUS,
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

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const POR_DIA_NO_CALENDARIO = 3;

const classeFiltro =
  "h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

/** Texto curto de um uso dentro do calendário: hora, placa e quem vai usar. */
const resumoDoUso = (uso: UsoVeiculo) =>
  [horaDe(uso.inicioPrevisto), uso.veiculo?.placa, uso.motorista].filter(Boolean).join(" · ");

/** Agenda da frota: quem vai usar qual veículo e quando. */
export function Agenda() {
  const hoje = useMemo(() => paraCampoDeHorario(new Date()).slice(0, 10), []);
  const [{ ano, mes }, setMes] = useState(() => ({
    ano: Number(hoje.slice(0, 4)),
    mes: Number(hoje.slice(5, 7)),
  }));

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

  useEffect(() => {
    let ativo = true;

    Promise.all([contaService.listarTodosVeiculos(), motoristasService.listar(), centrosCustoService.listar()])
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
  }, [recarregar]);

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

  const totalNoMes = usos.filter(ocupaAAgenda).length;
  const semVeiculos = cadastrosCarregados && veiculos.length === 0;

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <CalendarDays size={22} /> Agenda de veículos
          </h1>
          <p className="mt-1 text-sm text-gray-500">Quem vai usar cada veículo e quando.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportando(true)}
            className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <FileUp size={15} /> Importar planilha
          </button>
          <button
            type="button"
            onClick={() => setFormulario({ uso: null })}
            disabled={semVeiculos}
            className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Plus size={15} /> Reservar veículo
          </button>
        </div>
      </div>

      {semVeiculos && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Cadastre os veículos da frota em{" "}
          <Link to="/veiculos" className="font-semibold underline">
            Veículos da frota
          </Link>{" "}
          para poder reservá-los.
        </p>
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
            className="ml-1 h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Hoje
          </button>
        </div>

        <h2 className="min-w-40 text-base font-semibold text-gray-900 capitalize">{rotuloDoMes(ano, mes)}</h2>

        <div className="ml-auto flex flex-wrap gap-2">
          <select
            value={filtroVeiculo}
            onChange={(e) => {
              setCarregando(true);
              setFiltroVeiculo(e.target.value);
            }}
            aria-label="Filtrar por veículo"
            className={classeFiltro}
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
            className={classeFiltro}
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
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
          {erro}
        </p>
      )}

      {/* Calendário (telas largas) */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block" aria-busy={carregando}>
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-[10px] font-bold tracking-wide text-gray-500 uppercase">
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
                className={`min-h-28 border-r border-b border-gray-100 p-1.5 ${dia.doMes ? "bg-white" : "bg-gray-50/60"}`}
              >
                <button
                  type="button"
                  onClick={() => setFormulario({ uso: null, dia: dia.data })}
                  disabled={semVeiculos}
                  title="Reservar neste dia"
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold hover:bg-blue-50 disabled:cursor-default ${
                    dia.data === hoje
                      ? "bg-blue-600 text-white hover:bg-blue-600"
                      : dia.doMes
                        ? "text-gray-700"
                        : "text-gray-300"
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
                      title={`${uso.veiculo?.placa ?? ""} · ${ROTULO_STATUS_USO[uso.status]}`}
                      className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[10px] font-medium ${COR_DO_STATUS[uso.status]}`}
                    >
                      {resumoDoUso(uso)}
                    </button>
                  ))}
                  {doDia.length > POR_DIA_NO_CALENDARIO && (
                    <button
                      type="button"
                      onClick={() => setAberto(doDia[POR_DIA_NO_CALENDARIO])}
                      className="px-1 text-[10px] font-semibold text-gray-500 hover:text-gray-700"
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

      {/* Lista por dia (celular) */}
      <div className="space-y-3 md:hidden">
        {diasDoMes.map((dia) => {
          const doDia = usosDoDia(usos, dia.data);

          if (doDia.length === 0) return null;

          return (
            <section key={dia.data} className="rounded-xl border border-gray-200 bg-white p-3">
              <h3 className="mb-2 text-xs font-bold text-gray-700">
                {dia.data.slice(8, 10)}/{dia.data.slice(5, 7)}
                {dia.data === hoje && <span className="ml-2 text-blue-600">hoje</span>}
              </h3>
              <ul className="space-y-1.5">
                {doDia.map((uso) => (
                  <li key={uso.id}>
                    <button
                      type="button"
                      onClick={() => setAberto(uso)}
                      className={`block w-full rounded-lg border px-3 py-2 text-left text-xs ${COR_DO_STATUS[uso.status]}`}
                    >
                      <span className="font-semibold">
                        {uso.veiculo?.placa} · {uso.motorista ?? "sem motorista"}
                      </span>
                      <span className="block text-[11px] opacity-80">
                        {descreverJanela(uso.inicioPrevisto, uso.fimPrevisto)} · {ROTULO_STATUS_USO[uso.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {!carregando && totalNoMes === 0 && !erro && (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
          Nenhum uso agendado neste período. Use <strong>Reservar veículo</strong> ou clique em um dia do calendário.
        </p>
      )}

      {formulario && (
        <UsoFormModal
          uso={formulario.uso}
          diaInicial={formulario.dia}
          veiculos={veiculos}
          motoristas={motoristas}
          centros={centros}
          onSalvo={() => {
            setFormulario(null);
            setAberto(null);
            setRecarregar((n) => n + 1);
          }}
          onClose={() => setFormulario(null)}
        />
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
