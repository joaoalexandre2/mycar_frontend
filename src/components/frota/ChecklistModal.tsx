import { useEffect, useState, type FormEvent } from "react";
import { ClipboardCheck } from "lucide-react";
import { Modal } from "../ui/Modal";
import { checklistService } from "../../services/frotaDiferenciais";
import { mensagemErro } from "../../services/api";
import type { ModeloDeChecklist, MomentoDoChecklist, RespostaDeChecklists, SituacaoDoItem } from "../../types/frota";

const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

const TEXTO_DO_MOMENTO: Record<MomentoDoChecklist, string> = {
  saida: "saída",
  devolucao: "devolução",
};

interface ItemDaTela {
  chave: string;
  rotulo: string;
  obrigatorio: boolean;
}

interface Resposta {
  situacao: SituacaoDoItem;
  observacao: string;
}

/** O modelo do momento: o que é só dele, ou o que vale para os dois. */
function modeloDoMomento(modelos: ModeloDeChecklist[], momento: MomentoDoChecklist): ModeloDeChecklist | null {
  return modelos.find((m) => m.momento === momento) ?? modelos.find((m) => m.momento === "ambos") ?? null;
}

/** Checklist de saída ou de devolução de uma reserva, com os itens da empresa (ou os fixos, nas respostas antigas). */
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
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({});
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
  // Com modelos, a tela segue o modelo e envia a situação. Sem eles (resposta antiga), segue os itens fixos.
  const modelo = dados?.modelos ? modeloDoMomento(dados.modelos, momento) : null;
  const itens: ItemDaTela[] = modelo
    ? modelo.itens
    : dados
      ? (Object.entries(dados.itens) as [string, string][]).map(([chave, texto]) => ({ chave, rotulo: texto, obrigatorio: true }))
      : [];
  const comModelo = modelo !== null;

  function responder(chave: string, parcial: Partial<Resposta>) {
    setRespostas((atuais) => {
      const anterior: Resposta = atuais[chave] ?? { situacao: "ok", observacao: "" };

      return { ...atuais, [chave]: { ...anterior, ...parcial } };
    });
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const faltando = itens.filter((i) => i.obrigatorio && respostas[i.chave] === undefined);

    if (faltando.length > 0) {
      setErro("Marque cada item como OK ou com problema.");
      return;
    }

    // Só o checklist do modelo pede a descrição do problema; o formato antigo não pedia.
    const semDescricao = comModelo
      ? itens.find((i) => respostas[i.chave]?.situacao === "problema" && respostas[i.chave].observacao.trim() === "")
      : undefined;

    if (semDescricao) {
      setErro(`Descreva o problema em "${semDescricao.rotulo}".`);
      return;
    }

    try {
      setSalvando(true);

      if (modelo) {
        await checklistService.enviar(usoId, {
          momento,
          checklist_modelo_id: modelo.id,
          itens: itens
            .filter((i) => respostas[i.chave] !== undefined)
            .map((i) => ({
              item: i.chave,
              situacao: respostas[i.chave].situacao,
              observacao: respostas[i.chave].situacao === "problema" ? respostas[i.chave].observacao.trim() : null,
            })),
          observacoes: observacoes.trim() || null,
        });
      } else {
        await checklistService.enviar(usoId, {
          momento,
          itens: itens.map((i) => ({ item: i.chave, ok: respostas[i.chave]?.situacao !== "problema" })),
          observacoes: observacoes.trim() || null,
        });
      }

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
      subtitulo={modelo?.nome}
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
          {itens.map((item) => {
            const resposta = respostas[item.chave];

            return (
              <fieldset key={item.chave} className="space-y-2 border-b border-gray-100 pb-3">
                <legend className="w-full text-xs font-medium text-gray-900">
                  {item.rotulo}
                  {item.obrigatorio && <span className="text-red-600"> *</span>}
                </legend>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-gray-700">
                    <input type="radio" name={item.chave} checked={resposta?.situacao === "ok"} onChange={() => responder(item.chave, { situacao: "ok" })} />
                    OK
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-red-700">
                    <input type="radio" name={item.chave} checked={resposta?.situacao === "problema"} onChange={() => responder(item.chave, { situacao: "problema" })} />
                    Problema
                  </label>
                  {comModelo && (
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input type="radio" name={item.chave} checked={resposta?.situacao === "na"} onChange={() => responder(item.chave, { situacao: "na" })} />
                      Não se aplica
                    </label>
                  )}
                </div>
                {comModelo && resposta?.situacao === "problema" && (
                  <input
                    type="text"
                    aria-label={`Descreva o problema em ${item.rotulo}`}
                    placeholder="Descreva o problema"
                    maxLength={255}
                    value={resposta.observacao}
                    onChange={(e) => responder(item.chave, { observacao: e.target.value })}
                    className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                  />
                )}
              </fieldset>
            );
          })}

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
