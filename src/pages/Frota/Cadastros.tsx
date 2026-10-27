import { useEffect, useState, type FormEvent } from "react";
import { Building2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { centrosCustoService, motoristasService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { formatarData } from "../../utils/formatters";
import { situacaoDaCnh } from "../../utils/motorista";
import type { CentroCusto, Motorista } from "../../types/frota";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

type Aba = "motoristas" | "centros";

/** Motoristas e centros de custo da frota. */
export function Cadastros() {
  const [aba, setAba] = useState<Aba>("motoristas");

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Motoristas e centros de custo</h2>
        <p className="mt-1 text-sm text-gray-500">
          Quem dirige os veículos da frota e a que área cada gasto e cada viagem pertence.
        </p>
      </div>

      <div role="tablist" className="flex gap-1 border-b border-gray-200">
        {(
          [
            ["motoristas", "Motoristas", UserRound],
            ["centros", "Centros de custo", Building2],
          ] as const
        ).map(([chave, titulo, Icone]) => (
          <button
            key={chave}
            type="button"
            role="tab"
            aria-selected={aba === chave}
            onClick={() => setAba(chave)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold ${
              aba === chave
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icone size={14} /> {titulo}
          </button>
        ))}
      </div>

      {aba === "motoristas" ? <Motoristas /> : <Centros />}
    </div>
  );
}

// ---------------------------------------------------------------- motoristas

function Motoristas() {
  const pedirConfirmacao = useConfirmar();
  const [lista, setLista] = useState<Motorista[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<Motorista | "novo" | null>(null);
  // Cada ação que muda a lista soma 1 e o efeito abaixo busca de novo.
  const [versao, setVersao] = useState(0);
  const carregar = () => setVersao((v) => v + 1);

  useEffect(() => {
    let ativo = true;

    motoristasService
      .listar(true)
      .then((dados) => {
        if (!ativo) return;
        setLista(dados);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  async function alternarAtivo(m: Motorista) {
    try {
      await motoristasService.atualizar(m.id, { nome: m.nome, ativo: !m.ativo });
      carregar();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function remover(m: Motorista) {
    if (!(await pedirConfirmacao({ mensagem: `Remover o motorista ${m.nome}?`, confirmarTexto: "Remover", perigo: true }))) return;

    try {
      await motoristasService.remover(m.id);
      carregar();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditando("novo")}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={15} /> Novo motorista
        </button>
      </div>

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
          {erro}
        </p>
      )}

      {lista && lista.length === 0 && (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
          Nenhum motorista cadastrado ainda.
        </p>
      )}

      {lista && lista.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {lista.map((m) => {
            const cnh = situacaoDaCnh(m.cnhValidade);

            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className={m.ativo ? "" : "opacity-50"}>
                  <p className="text-sm font-semibold text-gray-900">{m.nome}</p>
                  <p className="text-xs text-gray-500">
                    {[m.telefone, m.cnhNumero ? `CNH ${m.cnhNumero}` : null].filter(Boolean).join(" · ") || "Sem contato"}
                    {m.cnhValidade && ` · validade ${formatarData(m.cnhValidade)}`}
                  </p>
                  {cnh === "vencida" && <p className="text-xs font-semibold text-red-600">CNH vencida</p>}
                  {cnh === "vence_em_breve" && <p className="text-xs font-semibold text-amber-600">CNH vence em breve</p>}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void alternarAtivo(m)}
                    className="h-8 rounded-lg px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    {m.ativo ? "Desativar" : "Reativar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditando(m)}
                    aria-label={`Editar ${m.nome}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remover(m)}
                    aria-label={`Remover ${m.nome}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editando && (
        <MotoristaModal
          motorista={editando === "novo" ? null : editando}
          onSalvo={() => {
            setEditando(null);
            carregar();
          }}
          onClose={() => setEditando(null)}
        />
      )}
    </section>
  );
}

function MotoristaModal({
  motorista,
  onSalvo,
  onClose,
}: {
  motorista: Motorista | null;
  onSalvo: () => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(motorista?.nome ?? "");
  const [telefone, setTelefone] = useState(motorista?.telefone ?? "");
  const [cnh, setCnh] = useState(motorista?.cnhNumero ?? "");
  const [validade, setValidade] = useState(motorista?.cnhValidade ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Informe o nome do motorista.");
      return;
    }

    const payload = {
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      cnh_numero: cnh.trim() || null,
      cnh_validade: validade || null,
    };

    try {
      setSalvando(true);

      if (motorista) {
        await motoristasService.atualizar(motorista.id, payload);
      } else {
        await motoristasService.criar(payload);
      }

      onSalvo();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={motorista ? "Editar motorista" : "Novo motorista"} icone={<UserRound size={16} />} onClose={onClose}>
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="mot-nome" className={rotulo}>Nome</label>
          <input id="mot-nome" type="text" value={nome} maxLength={120} onChange={(e) => setNome(e.target.value)} className={classeCampo} autoFocus />
        </div>
        <div>
          <label htmlFor="mot-tel" className={rotulo}>Telefone</label>
          <input id="mot-tel" type="text" value={telefone} maxLength={30} onChange={(e) => setTelefone(e.target.value)} className={classeCampo} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mot-cnh" className={rotulo}>CNH (número)</label>
            <input id="mot-cnh" type="text" value={cnh} maxLength={20} onChange={(e) => setCnh(e.target.value)} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="mot-validade" className={rotulo}>Validade da CNH</label>
            <input id="mot-validade" type="date" value={validade} onChange={(e) => setValidade(e.target.value)} className={classeCampo} />
          </div>
        </div>

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>
        )}

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

// ----------------------------------------------------------- centros de custo

function Centros() {
  const pedirConfirmacao = useConfirmar();
  const [lista, setLista] = useState<CentroCusto[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<CentroCusto | "novo" | null>(null);
  const [versao, setVersao] = useState(0);
  const carregar = () => setVersao((v) => v + 1);

  useEffect(() => {
    let ativo = true;

    centrosCustoService
      .listar(true)
      .then((dados) => {
        if (!ativo) return;
        setLista(dados);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  async function alternarAtivo(c: CentroCusto) {
    try {
      await centrosCustoService.atualizar(c.id, { nome: c.nome, codigo: c.codigo, ativo: !c.ativo });
      carregar();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function remover(c: CentroCusto) {
    if (!(await pedirConfirmacao({ mensagem: `Remover o centro de custo ${c.nome}?`, confirmarTexto: "Remover", perigo: true }))) return;

    try {
      await centrosCustoService.remover(c.id);
      carregar();
    } catch (error) {
      // Com histórico, o servidor pede para desativar em vez de apagar.
      setErro(mensagemErro(error));
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditando("novo")}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={15} /> Novo centro de custo
        </button>
      </div>

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
          {erro}
        </p>
      )}

      {lista && lista.length === 0 && (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
          Nenhum centro de custo cadastrado ainda. Exemplos: Vendas, Entregas, Diretoria.
        </p>
      )}

      {lista && lista.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {lista.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className={c.ativo ? "" : "opacity-50"}>
                <p className="text-sm font-semibold text-gray-900">{c.nome}</p>
                {c.codigo && <p className="text-xs text-gray-500">Código {c.codigo}</p>}
              </div>

              <div className="flex items-center gap-1">
                <button type="button" onClick={() => void alternarAtivo(c)} className="h-8 rounded-lg px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                  {c.ativo ? "Desativar" : "Reativar"}
                </button>
                <button type="button" onClick={() => setEditando(c)} aria-label={`Editar ${c.nome}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50">
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => void remover(c)} aria-label={`Remover ${c.nome}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <CentroModal
          centro={editando === "novo" ? null : editando}
          onSalvo={() => {
            setEditando(null);
            carregar();
          }}
          onClose={() => setEditando(null)}
        />
      )}
    </section>
  );
}

function CentroModal({
  centro,
  onSalvo,
  onClose,
}: {
  centro: CentroCusto | null;
  onSalvo: () => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(centro?.nome ?? "");
  const [codigo, setCodigo] = useState(centro?.codigo ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Informe o nome do centro de custo.");
      return;
    }

    const payload = { nome: nome.trim(), codigo: codigo.trim() || null };

    try {
      setSalvando(true);

      if (centro) {
        await centrosCustoService.atualizar(centro.id, { ...payload, ativo: centro.ativo });
      } else {
        await centrosCustoService.criar(payload);
      }

      onSalvo();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={centro ? "Editar centro de custo" : "Novo centro de custo"} icone={<Building2 size={16} />} onClose={onClose}>
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="cc-nome" className={rotulo}>Nome</label>
          <input id="cc-nome" type="text" value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} className={classeCampo} autoFocus />
        </div>
        <div>
          <label htmlFor="cc-codigo" className={rotulo}>Código (opcional)</label>
          <input id="cc-codigo" type="text" value={codigo} maxLength={30} onChange={(e) => setCodigo(e.target.value)} placeholder="Como está no sistema contábil" className={classeCampo} />
        </div>

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>
        )}

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
