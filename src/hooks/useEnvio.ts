import { useRef, useState } from "react";

/**
 * Controla o envio de um formulário: enquanto a ação roda, `enviando` fica
 * verdadeiro (para desabilitar o botão e mostrar "Salvando...") e um segundo
 * clique é ignorado. A trava é uma ref porque dois cliques seguidos chegam
 * antes de a tela ser redesenhada com o botão desabilitado.
 */
export function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const emAndamento = useRef(false);

  async function enviar(acao: () => void | Promise<void>) {
    if (emAndamento.current) {
      return;
    }

    emAndamento.current = true;
    setEnviando(true);

    try {
      await acao();
    } finally {
      emAndamento.current = false;
      setEnviando(false);
    }
  }

  return { enviando, enviar };
}
