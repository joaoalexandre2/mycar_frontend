import { useState } from "react";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { mensagemErro } from "../../services/api";
import { meusMycarsService, type MeusMycars } from "../../services/meusMycars";
import { NOME_CURTO_PERFIL } from "../../utils/perfil";
import type { Perfil } from "../../types/auth";
import { NovoMycarModal } from "./NovoMycarModal";

/** Depois de trocar de MyCar a tela recomeça do zero: nada do outro MyCar fica na memória. */
const recarregarNoInicio = () => window.location.assign("/");

/**
 * Troca de MyCar (oficina, Cuidados com seu carro, frota) sem sair da conta.
 * Fica no menu lateral, embaixo do nome MyCar.
 */
export function SeletorDeMycar({
  perfil,
  aoTrocar = recarregarNoInicio,
}: {
  perfil: Perfil;
  /** O que fazer quando a troca termina. Por padrão, recarrega o app no início. */
  aoTrocar?: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [lista, setLista] = useState<MeusMycars | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [trocando, setTrocando] = useState(false);
  const [criando, setCriando] = useState(false);

  async function alternar() {
    if (aberto) {
      setAberto(false);
      return;
    }

    setAberto(true);
    setErro(null);

    try {
      setLista(await meusMycarsService.listar());
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function abrir(id: string) {
    try {
      setTrocando(true);
      await meusMycarsService.ativar(id);
      aoTrocar();
    } catch (error) {
      setErro(mensagemErro(error));
      setTrocando(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void alternar()}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        title="Trocar de MyCar"
        className="-ml-1 flex items-center gap-1 rounded px-1 text-xs text-gray-500 transition hover:bg-gray-800 hover:text-white"
      >
        {NOME_CURTO_PERFIL[perfil]}
        <ChevronsUpDown size={11} aria-hidden />
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} aria-hidden />

          <div
            role="listbox"
            aria-label="Seus MyCar"
            className="absolute top-6 left-0 z-50 w-56 rounded-lg border border-gray-700 bg-gray-800 p-1 shadow-xl"
          >
            {!lista && !erro && <p className="px-3 py-2 text-xs text-gray-500">Carregando...</p>}

            {lista?.mycars.map((mycar) => (
              <button
                key={mycar.id}
                type="button"
                role="option"
                aria-selected={mycar.atual}
                disabled={trocando}
                onClick={() => (mycar.atual ? setAberto(false) : void abrir(mycar.id))}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-gray-200 transition hover:bg-gray-700 disabled:opacity-60"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{NOME_CURTO_PERFIL[mycar.perfil]}</span>
                  <span className="block truncate text-xs text-gray-500">{mycar.nome}</span>
                </span>
                {mycar.atual && <Check size={14} className="shrink-0 text-blue-400" aria-label="Aberto agora" />}
              </button>
            ))}

            {lista && lista.podeCriar.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setAberto(false);
                  setCriando(true);
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-md border-t border-gray-700 px-3 py-2 text-left text-xs text-blue-300 transition hover:bg-gray-700"
              >
                <PlusCircle size={14} aria-hidden /> Adicionar outro MyCar
              </button>
            )}

            {erro && (
              <p role="alert" className="px-3 py-2 text-xs text-red-300">
                {erro}
              </p>
            )}
          </div>
        </>
      )}

      {criando && lista && (
        <NovoMycarModal tipos={lista.podeCriar} aoCriar={aoTrocar} onClose={() => setCriando(false)} />
      )}
    </div>
  );
}
