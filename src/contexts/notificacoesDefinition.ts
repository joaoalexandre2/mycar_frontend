import { createContext } from "react";

export type TipoToast = "sucesso" | "erro" | "aviso";

export interface OpcoesConfirmacao {
  mensagem: string;
  titulo?: string;
  confirmarTexto?: string;
  cancelarTexto?: string;
  /** Ação destrutiva (excluir, remover): o botão de confirmar fica vermelho. */
  perigo?: boolean;
}

export interface Toasts {
  sucesso: (mensagem: string) => void;
  erro: (mensagem: string) => void;
  aviso: (mensagem: string) => void;
}

export interface NotificacoesValor {
  toast: Toasts;
  confirmar: (opcoes: OpcoesConfirmacao) => Promise<boolean>;
}

export const NotificacoesContext = createContext<NotificacoesValor | undefined>(
  undefined,
);
