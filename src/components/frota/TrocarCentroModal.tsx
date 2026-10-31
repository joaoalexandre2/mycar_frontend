import { useEffect, useState, type FormEvent } from "react";
import { Building2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { LinhaDeTroca } from "./LinhaDeTroca";
import { centrosCustoService, motivosTrocaCentroService, usosService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import type { CentroCusto, MotivoTrocaCentro, TrocaDeCentro, UsoVeiculo } from "../../types/frota";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

/**
 * Troca o centro de custo de um uso, mesmo concluído. O motivo vem da lista cadastrada pela frota e o
 * centro anterior fica no histórico, que aparece aqui embaixo.
 */
export function TrocarCentroModal({
  uso,
  onTrocado,
  onClose,
}: {
  uso: UsoVeiculo;
  onTrocado: (uso: UsoVeiculo) => void;
  onClose: () => void;
}) {
  const [centros, setCentros] = useState<CentroCusto[]>([]);
  const [historico, setHistorico] = useState<TrocaDeCentro[] | null>(null);
  const [centroId, setCentroId] = useState("");
  const [motivos, setMotivos] = useState<MotivoTrocaCentro[]>([]);
  const [motivoId, setMotivoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    centrosCustoService
      .listar()
      .then((dados) => {
        if (ativo) setCentros(dados);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    motivosTrocaCentroService
      .listar()
      .then((dados) => {
        if (ativo) setMotivos(dados);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    usosService
      .historicoDeCentros(uso.id)
      .then((dados) => {
        if (ativo) setHistorico(dados);
      })
      .catch(() => {
        if (ativo) setHistorico([]);
      });

    return () => {
      ativo = false;
    };
  }, [uso.id]);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!centroId) {
      setErro("Escolha o novo centro de custo.");
      return;
    }

    if (!motivoId) {
      setErro("Escolha o motivo da troca.");
      return;
    }

    try {
      setSalvando(true);
      onTrocado(await usosService.trocarCentro(uso.id, Number(centroId), Number(motivoId)));
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Trocar centro de custo" subtitulo={`Atual: ${uso.centroCusto ?? "sem centro"}`} icone={<Building2 size={16} />} onClose={onClose}>
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="tc-centro" className={rotulo}>Novo centro de custo</label>
          <select id="tc-centro" value={centroId} onChange={(e) => setCentroId(e.target.value)} className={classeCampo} autoFocus>
            <option value="">Escolha...</option>
            {centros
              .filter((c) => c.id !== uso.centroCustoId)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="tc-motivo" className={rotulo}>Motivo</label>
          <select id="tc-motivo" value={motivoId} onChange={(e) => setMotivoId(e.target.value)} className={classeCampo}>
            <option value="">Escolha...</option>
            {motivos.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
          {motivos.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">Nenhum motivo cadastrado. Cadastre em Cadastros &gt; Motivos de troca.</p>
          )}
        </div>

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {salvando ? "Salvando..." : "Trocar centro"}
          </button>
        </div>

        {historico && historico.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Trocas anteriores</p>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {historico.map((t) => (
                <LinhaDeTroca key={t.id} troca={t} />
              ))}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  );
}
