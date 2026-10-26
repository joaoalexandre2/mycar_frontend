import { useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useComportamentoDeModal } from "../../hooks/useComportamentoDeModal";

interface ModalProps {
  /** Nome do diálogo: aparece no cabeçalho e é o que o leitor de tela anuncia. */
  titulo: string;
  subtitulo?: string;
  icone?: ReactNode;
  onClose: () => void;
  /** Classe de largura máxima do Tailwind, por exemplo "max-w-2xl". */
  larguraMax?: string;
  /**
   * Fechar ao clicar fora. Fica desligado por padrão: em formulário, um clique
   * sem querer apagaria o que foi digitado.
   */
  fecharAoClicarFora?: boolean;
  children: ReactNode;
}

/**
 * Diálogo padrão do app: cabeçalho com título e botão de fechar, corpo com
 * rolagem própria. Cuida do que não é visual: role="dialog", rótulo, Esc, foco
 * preso e devolvido, e página atrás sem rolar.
 */
export function Modal({
  titulo,
  subtitulo,
  icone,
  onClose,
  larguraMax = "max-w-lg",
  fecharAoClicarFora = false,
  children,
}: ModalProps) {
  const idTitulo = useId();
  const conteiner = useComportamentoDeModal(onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden"
      onMouseDown={(evento) => {
        if (fecharAoClicarFora && evento.target === evento.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={conteiner}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={`max-h-[92dvh] w-full ${larguraMax} overflow-y-auto rounded-xl bg-white shadow-xl outline-none`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3
              id={idTitulo}
              className="flex items-center gap-2 text-sm font-semibold text-gray-900"
            >
              {icone}
              {titulo}
            </h3>
            {subtitulo && (
              <p className="mt-1 text-xs text-gray-500">{subtitulo}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X
              size={17}
              aria-hidden="true"
            />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Sobreposição em tela cheia (ver uma foto grande): mesmo comportamento do
 * Modal, sem cabeçalho próprio. Quem usa desenha a barra e o conteúdo.
 */
export function ModalTelaCheia({
  rotulo,
  onClose,
  children,
}: {
  rotulo: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const conteiner = useComportamentoDeModal(onClose);

  return createPortal(
    <div
      ref={conteiner}
      role="dialog"
      aria-modal="true"
      aria-label={rotulo}
      tabIndex={-1}
      className="fixed inset-0 z-[55] flex flex-col bg-black/90 p-4 outline-none print:hidden"
      onClick={onClose}
    >
      {children}
    </div>,
    document.body,
  );
}
