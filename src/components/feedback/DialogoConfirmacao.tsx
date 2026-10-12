import { useEffect, useRef } from "react";
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

  // Começa no "Cancelar": Enter sem querer não apaga nada.
  useEffect(() => {
    cancelar.current?.focus();

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        aoResponder(false);
      }
    }

    document.addEventListener("keydown", aoTeclar);

    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoResponder]);

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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
        aria-describedby="confirmacao-mensagem"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="confirmacao-titulo"
          className="text-base font-semibold text-gray-900"
        >
          {opcoes.titulo ?? "Confirmar"}
        </h2>

        <p
          id="confirmacao-mensagem"
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
