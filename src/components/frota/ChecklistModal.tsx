import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ClipboardCheck } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Alert } from "../ui/Alert";
import { Carregando } from "../ui/Carregando";
import { checklistService } from "../../services/frotaDiferenciais";
import { mensagemErro } from "../../services/api";
import type { ModeloDeChecklist, MomentoDoChecklist, RespostaDeChecklists, SituacaoDoItem } from "../../types/frota";
import { classeDaAreaDeTexto, classeDoCampo, classeDoRotulo } from "../ui/Campo";

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
  /** Depois de uma tentativa de salvar, os itens que faltam ficam marcados como inválidos. */
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [tentativaDeCarga, setTentativaDeCarga] = useState(0);
  const idFormulario = useId();
  const idErro = useId();
  // Onde levar o foco quando falta algo: o grupo de opções ou o campo de descrição de cada item.
  const grupos = useRef<Record<string, HTMLDivElement | null>>({});
  const descricoes = useRef<Record<string, HTMLInputElement | null>>({});

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
  }, [usoId, tentativaDeCarga]);

  function tentarCarregarDeNovo() {
    setErro(null);
    setTentativaDeCarga((n) => n + 1);
  }

  const jaFeito = dados?.checklists.some((c) => c.momento === momento) ?? false;
  // Com modelos, a tela segue o modelo e envia a situação. Sem eles (resposta antiga), segue os itens fixos.
  const modelo = dados?.modelos ? modeloDoMomento(dados.modelos, momento) : null;
  const itens: ItemDaTela[] = modelo
    ? modelo.itens
    : dados
      ? (Object.entries(dados.itens) as [string, string][]).map(([chave, texto]) => ({ chave, rotulo: texto, obrigatorio: true }))
      : [];
  const comModelo = modelo !== null;
  const mostrandoFormulario = dados !== null && !jaFeito;
  const respondidos = itens.filter((i) => respostas[i.chave] !== undefined).length;

  const faltaResponder = (item: ItemDaTela) => item.obrigatorio && respostas[item.chave] === undefined;
  // Só o checklist do modelo pede a descrição do problema; o formato antigo não pedia.
  const faltaDescrever = (item: ItemDaTela) =>
    comModelo && respostas[item.chave]?.situacao === "problema" && respostas[item.chave].observacao.trim() === "";

  /** Rola até o que falta e põe o foco nele: o aviso no rodapé sozinho não diz onde está. */
  function levarAte(elemento: HTMLElement | null | undefined) {
    if (!elemento) return;

    elemento.scrollIntoView?.({ block: "center" });
    elemento.focus({ preventScroll: true });
  }

  function responder(chave: string, parcial: Partial<Resposta>) {
    setRespostas((atuais) => {
      const anterior: Resposta = atuais[chave] ?? { situacao: "ok", observacao: "" };

      return { ...atuais, [chave]: { ...anterior, ...parcial } };
    });
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setTentouSalvar(true);

    const faltando = itens.filter(faltaResponder);

    if (faltando.length > 0) {
      const [primeiro] = faltando;
      const outros = faltando.length - 1;
      setErro(
        `Marque cada item como OK ou com problema. Falta "${primeiro.rotulo}"` +
          (outros > 0 ? ` e mais ${outros} ${outros === 1 ? "item" : "itens"}.` : "."),
      );
      levarAte(grupos.current[primeiro.chave]);
      return;
    }

    const semDescricao = itens.find(faltaDescrever);

    if (semDescricao) {
      setErro(`Descreva o problema em "${semDescricao.rotulo}".`);
      levarAte(descricoes.current[semDescricao.chave]);
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
      rodape={
        // Só com o formulário na tela: carregando, já feito ou com erro de carga não há o que salvar.
        mostrandoFormulario ? (
          <div className="space-y-2">
            {erro && (
              <Alert id={idErro} tone="danger">
                {erro}
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-11 flex-1 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50 sm:flex-none md:h-10"
              >
                Cancelar
              </button>
              {/* Fora do <form>, mas ligado a ele: o Enter num campo continua enviando. */}
              <button
                type="submit"
                form={idFormulario}
                disabled={salvando}
                className="h-11 flex-1 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:flex-none md:h-10"
              >
                {salvando ? "Salvando..." : "Salvar checklist"}
              </button>
            </div>
          </div>
        ) : undefined
      }
    >
      {!dados && !erro && <Carregando className="px-6 py-5" />}

      {dados && jaFeito && (
        <p className="px-6 py-5 text-xs text-gray-700">Este checklist de {TEXTO_DO_MOMENTO[momento]} já foi feito.</p>
      )}

      {mostrandoFormulario && (
        <form id={idFormulario} onSubmit={(e) => void enviar(e)} className="space-y-4 px-6 py-5">
          {/* Polite: o leitor de tela fala o progresso quando der, sem interromper. */}
          <p role="status" className="text-xs text-gray-500">
            {respondidos} de {itens.length} {itens.length === 1 ? "item respondido" : "itens respondidos"}
          </p>

          {itens.map((item, posicao) => {
            const resposta = respostas[item.chave];
            const idLegenda = `${idFormulario}-item-${posicao}`;
            const grupoInvalido = tentouSalvar && faltaResponder(item);
            const descricaoInvalida = tentouSalvar && faltaDescrever(item);

            return (
              <fieldset key={item.chave} className="space-y-2 border-b border-gray-100 pb-3">
                <legend id={idLegenda} className="w-full text-xs font-medium text-gray-900">
                  {item.rotulo}
                  {item.obrigatorio && <span className="text-red-600"> *</span>}
                </legend>
                {/* O grupo recebe o foco (tabIndex -1) quando é o item que falta. */}
                <div
                  ref={(el) => {
                    grupos.current[item.chave] = el;
                  }}
                  role="radiogroup"
                  aria-labelledby={idLegenda}
                  aria-invalid={grupoInvalido || undefined}
                  aria-describedby={grupoInvalido && erro ? idErro : undefined}
                  tabIndex={-1}
                  className={`flex flex-wrap items-center gap-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${grupoInvalido ? "ring-1 ring-red-300" : ""}`}
                >
                  <label className="flex items-center gap-1.5 text-xs text-gray-700">
                    <input type="radio" name={item.chave} checked={resposta?.situacao === "ok"} onChange={() => responder(item.chave, { situacao: "ok" })} />
                    OK
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-red-700">
                    <input type="radio" name={item.chave} checked={resposta?.situacao === "problema"} onChange={() => responder(item.chave, { situacao: "problema" })} />
                    Problema
                  </label>
                  {comModelo && (
                    <label className="flex items-center gap-1.5 text-xs text-gray-700">
                      <input type="radio" name={item.chave} checked={resposta?.situacao === "na"} onChange={() => responder(item.chave, { situacao: "na" })} />
                      Não se aplica
                    </label>
                  )}
                </div>
                {comModelo && resposta?.situacao === "problema" && (
                  <input
                    ref={(el) => {
                      descricoes.current[item.chave] = el;
                    }}
                    type="text"
                    aria-label={`Descreva o problema em ${item.rotulo}`}
                    aria-invalid={descricaoInvalida || undefined}
                    aria-describedby={descricaoInvalida && erro ? idErro : undefined}
                    placeholder="Descreva o problema"
                    maxLength={255}
                    value={resposta.observacao}
                    onChange={(e) => responder(item.chave, { observacao: e.target.value })}
                    className={classeDoCampo}
                  />
                )}
              </fieldset>
            );
          })}

          <div>
            <label htmlFor="checklist-obs" className={classeDoRotulo}>Observações (opcional)</label>
            <textarea
              id="checklist-obs"
              value={observacoes}
              maxLength={1000}
              onChange={(e) => setObservacoes(e.target.value)}
              className={classeDaAreaDeTexto}
              rows={3}
            />
          </div>
        </form>
      )}

      {erro && !dados && (
        <div className="px-6 py-5">
          <Alert tone="danger" action={{ label: "Tentar de novo", onClick: tentarCarregarDeNovo }}>
            {erro}
          </Alert>
        </div>
      )}
    </Modal>
  );
}
