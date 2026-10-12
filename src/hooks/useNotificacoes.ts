import { useContext } from "react";
import { NotificacoesContext } from "../contexts/notificacoesDefinition";

function useNotificacoes() {
  const contexto = useContext(NotificacoesContext);

  if (!contexto) {
    throw new Error(
      "useToast e useConfirmar devem ser usados dentro de um NotificacoesProvider",
    );
  }

  return contexto;
}

/** Avisos rápidos que somem sozinhos: toast.erro, toast.sucesso e toast.aviso. */
export function useToast() {
  return useNotificacoes().toast;
}

/**
 * Pergunta antes de uma ação irreversível (substitui o confirm do navegador):
 * if (!(await pedirConfirmacao({ mensagem: "Excluir?" }))) return;
 */
export function useConfirmar() {
  return useNotificacoes().confirmar;
}
