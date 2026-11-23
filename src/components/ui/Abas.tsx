import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface ItemDeAba<K extends string> {
  chave: K;
  titulo: ReactNode;
  icone?: LucideIcon;
}

/**
 * Abas no padrão do WAI-ARIA (tablist, tab e tabpanel ligados por
 * aria-controls e aria-labelledby). Só a aba escolhida entra no Tab; as setas
 * esquerda e direita andam entre elas (dando a volta), Home e End vão à
 * primeira e à última. Mudar de aba pelo teclado já mostra o painel dela.
 *
 * Só o painel da aba escolhida tem conteúdo: os outros existem vazios e
 * escondidos, para que todo aria-controls aponte para um elemento real.
 */
export function Abas<K extends string>({
  itens,
  atual,
  onMudar,
  rotulo,
  children,
}: {
  itens: readonly ItemDeAba<K>[];
  atual: K | undefined;
  onMudar: (chave: K) => void;
  /** Nome do grupo de abas para o leitor de tela. */
  rotulo: string;
  /** Conteúdo do painel da aba escolhida. */
  children: ReactNode;
}) {
  const base = useId();
  const botoes = useRef(new Map<K, HTMLButtonElement>());

  if (itens.length === 0) return null;

  const idDaAba = (chave: K) => `${base}-aba-${chave}`;
  const idDoPainel = (chave: K) => `${base}-painel-${chave}`;

  function aoTeclar(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const ultimo = itens.length - 1;
    const destino = {
      ArrowRight: indice === ultimo ? 0 : indice + 1,
      ArrowLeft: indice === 0 ? ultimo : indice - 1,
      Home: 0,
      End: ultimo,
    }[evento.key];

    if (destino === undefined) return;

    evento.preventDefault();
    const chave = itens[destino].chave;
    onMudar(chave);
    botoes.current.get(chave)?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label={rotulo} className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {itens.map(({ chave, titulo, icone: Icone }, indice) => {
          const escolhida = atual === chave;

          return (
            <button
              key={chave}
              ref={(elemento) => {
                if (elemento) botoes.current.set(chave, elemento);
                else botoes.current.delete(chave);
              }}
              id={idDaAba(chave)}
              type="button"
              role="tab"
              aria-selected={escolhida}
              aria-controls={idDoPainel(chave)}
              tabIndex={escolhida ? 0 : -1}
              onClick={() => onMudar(chave)}
              onKeyDown={(evento) => aoTeclar(evento, indice)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold ${
                escolhida ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {Icone && <Icone size={14} aria-hidden="true" />} {titulo}
            </button>
          );
        })}
      </div>

      {/* Um só elemento para o espaçamento do pai (space-y) continuar igual. */}
      <div>
        {itens.map(({ chave }) => (
          <div
            key={chave}
            id={idDoPainel(chave)}
            role="tabpanel"
            aria-labelledby={idDaAba(chave)}
            hidden={atual !== chave}
          >
            {atual === chave ? children : null}
          </div>
        ))}
      </div>
    </>
  );
}
