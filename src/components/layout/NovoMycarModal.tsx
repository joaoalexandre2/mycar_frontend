import { useState, type FormEvent } from "react";
import { PlusCircle } from "lucide-react";
import { Modal } from "../ui/Modal";
import { mensagemErro } from "../../services/api";
import { meusMycarsService } from "../../services/meusMycars";
import { ORDEM_PERFIS, PERFIS } from "../../utils/perfil";
import type { Perfil } from "../../types/auth";

const ROTULO_DO_NOME: Partial<Record<Perfil, string>> = {
  oficina: "Nome da oficina",
  frota: "Nome da empresa",
};

const campo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

/**
 * Cria mais um MyCar para a mesma pessoa (mesmo e-mail e senha). O MyCar novo
 * começa vazio e já fica aberto neste aparelho.
 */
export function NovoMycarModal({
  tipos,
  aoCriar,
  onClose,
}: {
  /** Tipos que a pessoa ainda pode criar. */
  tipos: Perfil[];
  aoCriar: () => void;
  onClose: () => void;
}) {
  const opcoes = ORDEM_PERFIS.filter((perfil) => tipos.includes(perfil));
  const [perfil, setPerfil] = useState<Perfil>(opcoes[0] ?? "pessoa");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const rotuloDoNome = ROTULO_DO_NOME[perfil];

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (rotuloDoNome && nome.trim() === "") {
      setErro(`Informe o ${rotuloDoNome.toLowerCase()}.`);
      return;
    }

    try {
      setSalvando(true);
      await meusMycarsService.criar({ perfil, nome: rotuloDoNome ? nome.trim() : undefined });
      aoCriar();
    } catch (error) {
      setErro(mensagemErro(error));
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Adicionar outro MyCar"
      subtitulo="Mesmo e-mail e senha, com os dados separados."
      icone={<PlusCircle size={16} />}
      onClose={onClose}
    >
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-xs font-medium text-gray-700">Qual MyCar você quer?</legend>

          {opcoes.map((opcao) => (
            <label
              key={opcao}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${
                perfil === opcao ? "border-blue-500 bg-blue-50/50" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="perfil"
                value={opcao}
                checked={perfil === opcao}
                onChange={() => {
                  setPerfil(opcao);
                  setErro(null);
                }}
                className="mt-0.5"
              />
              <span>
                <span className="block text-xs font-semibold text-gray-900">{PERFIS[opcao].produto}</span>
                <span className="block text-xs text-gray-500">{PERFIS[opcao].descricao}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {rotuloDoNome && (
          <div>
            <label htmlFor="nome-do-mycar" className="mb-1.5 block text-xs font-medium text-gray-700">
              {rotuloDoNome}
            </label>
            <input
              id="nome-do-mycar"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={150}
              className={campo}
              autoFocus
            />
          </div>
        )}

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
            {salvando ? "Criando..." : "Criar e abrir"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
