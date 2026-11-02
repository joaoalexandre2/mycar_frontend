import { useEffect, useState, type FormEvent } from "react";
import { ClipboardCheck } from "lucide-react";
import { Modal } from "../ui/Modal";
import { checklistService } from "../../services/frotaDiferenciais";
import { mensagemErro } from "../../services/api";
import type { ChaveDoItemDoChecklist, MomentoDoChecklist, RespostaDeChecklists } from "../../types/frota";

const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

const TEXTO_DO_MOMENTO: Record<MomentoDoChecklist, string> = {
  saida: "saída",
  devolucao: "devolução",
};

/** Checklist de saída ou de devolução de uma reserva: cada item OK ou com problema. */
export function ChecklistModal({
  usoId,
  momento,
  onSalvo,
  onClose,
}: {
  usoId: number;
  momento: MomentoDoChecklist;
  onSalvo: () => void;
  onClose: () => void;
}) {
  const [dados, setDados] = useState<RespostaDeChecklists | null>(null);
  const [respostas, setRespostas] = useState<Partial<Record<ChaveDoItemDoChecklist, boolean>>>({});
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    checklistService
      .listar(usoId)
      .then((resposta) => {
        if (ativo) setDados(resposta);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [usoId]);

  const jaFeito = dados?.checklists.some((c) => c.momento === momento) ?? false;
  const chaves = dados ? (Object.keys(dados.itens) as ChaveDoItemDoChecklist[]) : [];
  const completo = chaves.length > 0 && chaves.every((c) => respostas[c] !== undefined);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!completo) {
      setErro("Marque cada item como OK ou com problema.");
      return;
    }

    try {
      setSalvando(true);
      await checklistService.enviar(usoId, {
        momento,
        itens: chaves.map((item) => ({ item, ok: respostas[item] === true })),
        observacoes: observacoes.trim() || null,
      });
      onSalvo();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={`Checklist de ${TEXTO_DO_MOMENTO[momento]}`}
      icone={<ClipboardCheck size={16} />}
      onClose={onClose}
      larguraMax="max-w-lg"
    >
      {!dados && !erro && <p className="px-6 py-5 text-xs text-gray-500">Carregando...</p>}

      {dados && jaFeito && (
        <p className="px-6 py-5 text-xs text-gray-700">Este checklist de {TEXTO_DO_MOMENTO[momento]} já foi feito.</p>
      )}

      {dados && !jaFeito && (
        <form onSubmit={(e) => void enviar(e)} className="space-y-4 px-6 py-5">
          {chaves.map((chave) => (
            <fieldset key={chave} className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <legend className="w-full text-xs font-medium text-gray-900">{dados.itens[chave]}</legend>
              <label className="flex items-center gap-1.5 text-xs text-gray-700">
                <input type="radio" name={chave} checked={respostas[chave] === true} onChange={() => setRespostas((r) => ({ ...r, [chave]: true }))} />
                OK
              </label>
              <label className="flex items-center gap-1.5 text-xs text-red-700">
                <input type="radio" name={chave} checked={respostas[chave] === false} onChange={() => setRespostas((r) => ({ ...r, [chave]: false }))} />
                Problema
              </label>
            </fieldset>
          ))}

          <div>
            <label htmlFor="checklist-obs" className={rotulo}>Observações (opcional)</label>
            <textarea
              id="checklist-obs"
              value={observacoes}
              maxLength={1000}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
              rows={3}
            />
          </div>

          {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {salvando ? "Salvando..." : "Salvar checklist"}
            </button>
          </div>
        </form>
      )}

      {erro && !dados && <p role="alert" className="px-6 py-5 text-xs text-red-600">{erro}</p>}
    </Modal>
  );
}
