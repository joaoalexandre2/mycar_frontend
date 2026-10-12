import { useEffect, useRef } from "react";

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Diálogos abertos, do mais antigo para o mais novo: só o de cima reage ao teclado. */
const pilha: symbol[] = [];

/** Quantos diálogos pedem para a página atrás não rolar. */
let travasDeRolagem = 0;

/**
 * O que todo diálogo precisa: Esc fecha o de cima, o foco entra no diálogo e
 * fica preso nele (Tab e Shift+Tab giram), volta ao botão que o abriu ao
 * fechar, e a página atrás não rola.
 *
 * Devolve a ref do conteiner do diálogo (com tabIndex={-1}).
 */
export function useComportamentoDeModal(onClose: () => void) {
  const conteiner = useRef<HTMLDivElement>(null);
  const aoFechar = useRef(onClose);

  useEffect(() => {
    aoFechar.current = onClose;
  });

  useEffect(() => {
    const id = Symbol("modal");
    const quemAbriu = document.activeElement as HTMLElement | null;

    pilha.push(id);
    travasDeRolagem += 1;
    if (travasDeRolagem === 1) {
      document.body.style.overflow = "hidden";
    }

    conteiner.current?.focus();

    function aoTeclar(evento: KeyboardEvent) {
      if (pilha[pilha.length - 1] !== id) return;

      if (evento.key === "Escape") {
        evento.stopPropagation();
        aoFechar.current();
        return;
      }

      if (evento.key !== "Tab" || !conteiner.current) return;

      const itens = Array.from(
        conteiner.current.querySelectorAll<HTMLElement>(FOCAVEIS),
      );

      if (itens.length === 0) {
        evento.preventDefault();
        conteiner.current.focus();
        return;
      }

      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      const atual = document.activeElement;
      const dentro = conteiner.current.contains(atual);

      if (evento.shiftKey && (!dentro || atual === primeiro || atual === conteiner.current)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && (!dentro || atual === ultimo)) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.removeEventListener("keydown", aoTeclar);

      const posicao = pilha.indexOf(id);
      if (posicao >= 0) pilha.splice(posicao, 1);

      travasDeRolagem -= 1;
      if (travasDeRolagem === 0) {
        document.body.style.overflow = "";
      }

      if (quemAbriu?.isConnected) {
        quemAbriu.focus();
      }
    };
  }, []);

  return conteiner;
}
