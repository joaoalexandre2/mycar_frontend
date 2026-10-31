import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { gruposUsuariosService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { useConfirmar } from "../../hooks/useNotificacoes";
import type { GrupoUsuario, GruposDaFrota } from "../../types/frota";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

/** Grupos de usuários da frota: quem faz parte e o que cada grupo pode fazer além do papel. */
export function Grupos() {
  const pedirConfirmacao = useConfirmar();
  const [dados, setDados] = useState<GruposDaFrota | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<GrupoUsuario | "novo" | null>(null);
  const [versao, setVersao] = useState(0);
  const carregar = () => setVersao((v) => v + 1);

  useEffect(() => {
    let ativo = true;

    gruposUsuariosService
      .listar()
      .then((resposta) => {
        if (!ativo) return;
        setDados(resposta);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  async function remover(grupo: GrupoUsuario) {
    if (
      !(await pedirConfirmacao({
        mensagem: `Remover o grupo ${grupo.nome}? Os membros perdem as permissões que ele dava.`,
        confirmarTexto: "Remover",
        perigo: true,
      }))
    )
      return;

    try {
      await gruposUsuariosService.remover(grupo.id);
      carregar();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          O grupo soma permissões ao papel de cada membro. O administrador sempre tem todas.
        </p>
        <button
          type="button"
          onClick={() => setEditando("novo")}
          disabled={!dados}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Plus size={15} /> Novo grupo
        </button>
      </div>

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
          {erro}
        </p>
      )}

      {dados && dados.grupos.length === 0 && (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
          Nenhum grupo criado ainda. Exemplo: um grupo “Apoio” que pode gerenciar centros de custo.
        </p>
      )}

      {dados && dados.grupos.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {dados.grupos.map((g) => (
            <li key={g.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-gray-900">{g.nome}</p>
                {g.descricao && <p className="text-xs text-gray-500">{g.descricao}</p>}
                <p className="text-xs text-gray-600">
                  {g.permissoes.length === 0
                    ? "Sem permissões extras"
                    : g.permissoes.map((p) => dados.catalogo[p] ?? p).join(" · ")}
                </p>
                <p className="text-xs text-gray-500">
                  {g.membros.length === 0
                    ? "Sem membros"
                    : `${g.membros.length} ${g.membros.length === 1 ? "membro" : "membros"}: ${g.membros.map((m) => m.name).join(", ")}`}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditando(g)}
                  aria-label={`Editar ${g.nome}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => void remover(g)}
                  aria-label={`Remover ${g.nome}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando && dados && (
        <GrupoModal
          grupo={editando === "novo" ? null : editando}
          dados={dados}
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

function alternar<T>(lista: T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

function GrupoModal({
  grupo,
  dados,
  onSalvo,
  onClose,
}: {
  grupo: GrupoUsuario | null;
  dados: GruposDaFrota;
  onSalvo: () => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(grupo?.nome ?? "");
  const [descricao, setDescricao] = useState(grupo?.descricao ?? "");
  const [permissoes, setPermissoes] = useState<string[]>(grupo?.permissoes ?? []);
  const [membros, setMembros] = useState<number[]>(grupo?.membros.map((m) => m.id) ?? []);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Informe o nome do grupo.");
      return;
    }

    const payload = { nome: nome.trim(), descricao: descricao.trim() || null, permissoes, membros };

    try {
      setSalvando(true);

      if (grupo) {
        await gruposUsuariosService.atualizar(grupo.id, payload);
      } else {
        await gruposUsuariosService.criar(payload);
      }

      onSalvo();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={grupo ? "Editar grupo" : "Novo grupo"} icone={<Users size={16} />} onClose={onClose} larguraMax="max-w-xl">
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="grp-nome" className={rotulo}>Nome</label>
          <input id="grp-nome" type="text" value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} className={classeCampo} autoFocus />
        </div>
        <div>
          <label htmlFor="grp-desc" className={rotulo}>Descrição (opcional)</label>
          <input id="grp-desc" type="text" value={descricao} maxLength={255} onChange={(e) => setDescricao(e.target.value)} className={classeCampo} />
        </div>

        <fieldset className="space-y-2">
          <legend className={rotulo}>O que o grupo pode fazer</legend>
          {Object.entries(dados.catalogo).map(([chave, texto]) => (
            <label key={chave} className="flex items-start gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={permissoes.includes(chave)}
                onChange={() => setPermissoes((atual) => alternar(atual, chave))}
                className="mt-0.5"
              />
              {texto}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className={rotulo}>Membros</legend>
          {dados.usuarios.length === 0 && <p className="text-xs text-gray-500">Nenhum usuário na frota.</p>}
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {dados.usuarios.map((u) => (
              <label key={u.id} className="flex items-start gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={membros.includes(u.id)}
                  onChange={() => setMembros((atual) => alternar(atual, u.id))}
                  className="mt-0.5"
                />
                <span>
                  {u.name} <span className="text-gray-500">{u.email}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

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
