import { useEffect, useId, useRef } from "react";
import { useComportamentoDeModal } from "../../hooks/useComportamentoDeModal";
import type { OpcoesConfirmacao } from "../../contexts/notificacoesDefinition";

/** Caixa de confirmação (substitui window.confirm). Esc ou clicar fora cancela. */
export function DialogoConfirmacao({
  opcoes,
  aoResponder,
}: {
  opcoes: OpcoesConfirmacao;
  aoResponder: (confirmado: boolean) => void;
}) {
  const cancelar = useRef<HTMLButtonElement>(null);
  const idTitulo = useId();
  const idMensagem = useId();

  // Esc cancela, o foco fica preso no diálogo e volta para quem o abriu.
  const conteiner = useComportamentoDeModal(() => aoResponder(false));

  // Começa no "Cancelar": Enter sem querer não apaga nada. Roda depois do
  // efeito do hook, que põe o foco no contêiner.
  useEffect(() => {
    cancelar.current?.focus();
  }, []);

  const perigo = opcoes.perigo ?? false;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 print:hidden"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          aoResponder(false);
        }
      }}
    >
      <div
        ref={conteiner}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idMensagem}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl outline-none"
      >
        <h2
          id={idTitulo}
          className="text-base font-semibold text-gray-900"
        >
          {opcoes.titulo ?? "Confirmar"}
        </h2>

        <p
          id={idMensagem}
          className="mt-2 whitespace-pre-line text-sm text-gray-600"
        >
          {opcoes.mensagem}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelar}
            type="button"
            onClick={() => aoResponder(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {opcoes.cancelarTexto ?? "Cancelar"}
          </button>

          <button
            type="button"
            onClick={() => aoResponder(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
              perigo
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            {opcoes.confirmarTexto ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
