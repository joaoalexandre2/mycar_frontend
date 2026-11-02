import { useEffect, useState, type FormEvent } from "react";
import { ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { checklistModelosService, type ItemDeModelo, type PayloadDeModelo } from "../../services/frotaDiferenciais";
import { mensagemErro } from "../../services/api";
import type { ModeloDeChecklist } from "../../types/frota";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

const MOMENTOS: { valor: PayloadDeModelo["momento"]; texto: string }[] = [
  { valor: "saida", texto: "Saída" },
  { valor: "devolucao", texto: "Devolução" },
  { valor: "ambos", texto: "Saída e devolução" },
];

/** Editor de um modelo: nome, momento e os itens que o motorista confere. */
function EditorDeModelo({
  modelo,
  onSalvo,
  onClose,
}: {
  modelo: ModeloDeChecklist | null;
  onSalvo: () => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(modelo?.nome ?? "");
  const [momento, setMomento] = useState<PayloadDeModelo["momento"]>(modelo?.momento ?? "ambos");
  const [itens, setItens] = useState<ItemDeModelo[]>(
    modelo?.itens.map((i) => ({ chave: i.chave, rotulo: i.rotulo, obrigatorio: i.obrigatorio })) ?? [{ rotulo: "", obrigatorio: true }],
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function alterarItem(indice: number, campos: Partial<ItemDeModelo>) {
    setItens((atuais) => atuais.map((item, i) => (i === indice ? { ...item, ...campos } : item)));
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const itensValidos = itens.filter((i) => i.rotulo.trim() !== "");

    if (nome.trim() === "" || itensValidos.length === 0) {
      setErro("Dê um nome ao modelo e informe pelo menos um item.");
      return;
    }

    const payload: PayloadDeModelo = {
      nome: nome.trim(),
      momento,
      itens: itensValidos.map((i) => ({ chave: i.chave, rotulo: i.rotulo.trim(), obrigatorio: i.obrigatorio })),
    };

    try {
      setSalvando(true);

      if (modelo) {
        await checklistModelosService.atualizar(modelo.id, payload);
      } else {
        await checklistModelosService.criar(payload);
      }

      onSalvo();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={modelo ? "Editar checklist" : "Novo checklist"} icone={<ClipboardCheck size={16} />} onClose={onClose} larguraMax="max-w-lg">
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="modelo-nome" className={rotulo}>Nome</label>
            <input id="modelo-nome" type="text" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="modelo-momento" className={rotulo}>Usado na</label>
            <select id="modelo-momento" value={momento} onChange={(e) => setMomento(e.target.value as PayloadDeModelo["momento"])} className={classeCampo}>
              {MOMENTOS.map((m) => (
                <option key={m.valor} value={m.valor}>{m.texto}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <p className={rotulo}>Itens que o motorista confere</p>
          {itens.map((item, indice) => (
            <div key={indice} className="flex items-center gap-2">
              <input
                type="text"
                aria-label={`Item ${indice + 1}`}
                maxLength={80}
                value={item.rotulo}
                onChange={(e) => alterarItem(indice, { rotulo: e.target.value })}
                placeholder="Ex.: Nível de óleo"
                className={classeCampo}
              />
              <label className="flex shrink-0 items-center gap-1 text-xs text-gray-600">
                <input type="checkbox" checked={item.obrigatorio} onChange={(e) => alterarItem(indice, { obrigatorio: e.target.checked })} />
                Obrigatório
              </label>
              <button
                type="button"
                onClick={() => setItens((atuais) => atuais.filter((_, i) => i !== indice))}
                aria-label={`Remover item ${indice + 1}`}
                disabled={itens.length === 1}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItens((atuais) => [...atuais, { rotulo: "", obrigatorio: true }])}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus size={13} /> Adicionar item
          </button>
        </div>

        {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Os checklists da empresa: o que o motorista confere na saída e na devolução. */
export function ModelosDeChecklist() {
  const pedirConfirmacao = useConfirmar();
  const [modelos, setModelos] = useState<ModeloDeChecklist[]>([]);
  const [editando, setEditando] = useState<ModeloDeChecklist | null>(null);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;

    checklistModelosService
      .listar()
      .then((lista) => {
        if (!ativo) return;
        setModelos(lista);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  async function remover(modelo: ModeloDeChecklist) {
    if (!(await pedirConfirmacao({ mensagem: `Remover o checklist "${modelo.nome}"?`, confirmarTexto: "Remover", perigo: true }))) return;

    try {
      await checklistModelosService.remover(modelo.id);
      setVersao((v) => v + 1);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Monte o checklist de cada tipo de carro. O motorista vê estes itens ao fazer o checklist da reserva.</p>
        <button type="button" onClick={() => setCriando(true)} className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={15} /> Novo checklist
        </button>
      </div>

      {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>}

      <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {modelos.map((modelo) => (
          <li key={modelo.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{modelo.nome}</p>
              <p className="text-xs text-gray-500">
                {MOMENTOS.find((m) => m.valor === modelo.momento)?.texto ?? modelo.momento} · {modelo.itens.length} item(ns)
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setEditando(modelo)} aria-label={`Editar ${modelo.nome}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                <Pencil size={14} />
              </button>
              <button type="button" onClick={() => void remover(modelo)} aria-label={`Remover ${modelo.nome}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50">
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {(criando || editando) && (
        <EditorDeModelo
          modelo={editando}
          onSalvo={() => {
            setCriando(false);
            setEditando(null);
            setVersao((v) => v + 1);
          }}
          onClose={() => {
            setCriando(false);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}
