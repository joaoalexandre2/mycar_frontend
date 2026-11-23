import { useState, type FormEvent } from "react";
import { Tags } from "lucide-react";
import { Alert } from "../ui/Alert";
import { Modal } from "../ui/Modal";
import { classeDoCampo, classeDoRotulo } from "../ui/Campo";
import { categoriasDeDespesaService } from "../../services/financeiro";
import { mensagemErro } from "../../services/api";
import type { CategoriaDeDespesa } from "../../types/financeiro";

interface Props {
  categorias: CategoriaDeDespesa[];
  onAlterou: () => void;
  onClose: () => void;
}

/** Categorias das despesas avulsas: a empresa cria as suas e desativa as que não usa mais. */
export function CategoriasDespesaModal({ categorias, onAlterou, onClose }: Props) {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Informe o nome da categoria.");
      return;
    }

    try {
      await categoriasDeDespesaService.criar(nome.trim());
      setNome("");
      onAlterou();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function alternarAtivo(categoria: CategoriaDeDespesa) {
    setErro(null);

    try {
      await categoriasDeDespesaService.alterar(categoria.id, { ativo: !categoria.ativo });
      onAlterou();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <Modal titulo="Categorias de despesa" icone={<Tags size={16} />} onClose={onClose} larguraMax="max-w-md">
      <div className="space-y-5 px-6 py-5">
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {categorias.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className={`text-sm ${c.ativo ? "text-gray-900" : "text-gray-400 line-through"}`}>{c.nome}</span>
              <button
                type="button"
                onClick={() => void alternarAtivo(c)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {c.ativo ? "Desativar" : "Reativar"}
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={(e) => void criar(e)} className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="nova-categoria" className={classeDoRotulo}>Nova categoria</label>
            <input
              id="nova-categoria"
              type="text"
              maxLength={60}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={classeDoCampo}
            />
          </div>
          <button type="submit" className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
            Adicionar
          </button>
        </form>

        {erro && <Alert tone="danger">{erro}</Alert>}
      </div>
    </Modal>
  );
}
