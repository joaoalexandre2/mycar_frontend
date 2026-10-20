import { useState, type FormEvent } from "react";
import { CalendarPlus } from "lucide-react";
import { Modal } from "../ui/Modal";
import { usosService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { hojeAs } from "../../utils/agenda";
import type { VeiculoConta } from "../../types/conta";
import type { CentroCusto, Motorista, UsoVeiculo } from "../../types/frota";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

/**
 * Reserva de um veículo: quem vai usar, quando e para quê. O servidor bloqueia
 * o mesmo veículo e o mesmo motorista no mesmo horário e a mensagem aparece aqui.
 */
export function UsoFormModal({
  uso,
  diaInicial,
  veiculos,
  motoristas,
  centros,
  onSalvo,
  onClose,
}: {
  /** Vazio para uma reserva nova. */
  uso?: UsoVeiculo | null;
  /** "2026-11-10": dia clicado no calendário, para preencher o início e o fim. */
  diaInicial?: string;
  veiculos: VeiculoConta[];
  motoristas: Motorista[];
  centros: CentroCusto[];
  onSalvo: (uso: UsoVeiculo) => void;
  onClose: () => void;
}) {
  const emUso = uso?.status === "em_uso";

  const [veiculoId, setVeiculoId] = useState(uso ? String(uso.veiculoId) : "");
  const [motoristaId, setMotoristaId] = useState(uso?.motoristaId ? String(uso.motoristaId) : "");
  const [centroId, setCentroId] = useState(uso?.centroCustoId ? String(uso.centroCustoId) : "");
  const [inicio, setInicio] = useState(
    uso?.inicioPrevisto ?? (diaInicial ? `${diaInicial}T08:00` : hojeAs(8)),
  );
  const [fim, setFim] = useState(uso?.fimPrevisto ?? (diaInicial ? `${diaInicial}T18:00` : hojeAs(18)));
  const [finalidade, setFinalidade] = useState(uso?.finalidade ?? "");
  const [observacoes, setObservacoes] = useState(uso?.observacoes ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  /** Escolhido o veículo, sugere o centro de custo padrão dele (se ainda não escolheu outro). */
  function escolherVeiculo(id: string) {
    setVeiculoId(id);

    const padrao = veiculos.find((v) => String(v.id) === id)?.centroCustoId;

    if (padrao && !centroId) {
      setCentroId(String(padrao));
    }
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!veiculoId) {
      setErro("Escolha o veículo.");
      return;
    }

    if (fim <= inicio) {
      setErro("O fim da reserva precisa ser depois do início.");
      return;
    }

    const payload = {
      veiculo_conta_id: Number(veiculoId),
      motorista_id: motoristaId ? Number(motoristaId) : null,
      centro_custo_id: centroId ? Number(centroId) : null,
      inicio_previsto: inicio,
      fim_previsto: fim,
      finalidade: finalidade.trim() || null,
      observacoes: observacoes.trim() || null,
    };

    try {
      setSalvando(true);
      onSalvo(uso ? await usosService.atualizar(uso.id, payload) : await usosService.criar(payload));
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={uso ? "Editar uso do veículo" : "Reservar veículo"}
      subtitulo="Quem vai usar, quando e para quê."
      icone={<CalendarPlus size={16} />}
      onClose={onClose}
      larguraMax="max-w-xl"
    >
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="uso-veiculo" className={rotulo}>
            Veículo
          </label>
          <select
            id="uso-veiculo"
            value={veiculoId}
            onChange={(e) => escolherVeiculo(e.target.value)}
            disabled={emUso}
            className={classeCampo}
          >
            <option value="">Selecione o veículo</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.placa} · {v.apelido || `${v.marca} ${v.modelo}`}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="uso-motorista" className={rotulo}>
              Motorista
            </label>
            <select
              id="uso-motorista"
              value={motoristaId}
              onChange={(e) => setMotoristaId(e.target.value)}
              className={classeCampo}
            >
              <option value="">Sem motorista definido</option>
              {motoristas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="uso-centro" className={rotulo}>
              Centro de custo
            </label>
            <select
              id="uso-centro"
              value={centroId}
              onChange={(e) => setCentroId(e.target.value)}
              className={classeCampo}
            >
              <option value="">Padrão do veículo</option>
              {centros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="uso-inicio" className={rotulo}>
              Início
            </label>
            <input
              id="uso-inicio"
              type="datetime-local"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              disabled={emUso}
              required
              className={classeCampo}
            />
          </div>

          <div>
            <label htmlFor="uso-fim" className={rotulo}>
              Fim previsto
            </label>
            <input
              id="uso-fim"
              type="datetime-local"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
              required
              className={classeCampo}
            />
          </div>
        </div>

        <div>
          <label htmlFor="uso-finalidade" className={rotulo}>
            Finalidade
          </label>
          <input
            id="uso-finalidade"
            type="text"
            value={finalidade}
            maxLength={160}
            onChange={(e) => setFinalidade(e.target.value)}
            placeholder="Ex.: visita a clientes, entrega em Campinas"
            className={classeCampo}
          />
        </div>

        <div>
          <label htmlFor="uso-obs" className={rotulo}>
            Observações
          </label>
          <textarea
            id="uso-obs"
            value={observacoes}
            maxLength={2000}
            rows={2}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
          />
        </div>

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : uso ? "Salvar alterações" : "Reservar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
