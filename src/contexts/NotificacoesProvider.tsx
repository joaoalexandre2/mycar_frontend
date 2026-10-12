import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  NotificacoesContext,
  type OpcoesConfirmacao,
  type TipoToast,
} from "./notificacoesDefinition";
import { Toasts, type ToastItem } from "../components/feedback/Toasts";
import { DialogoConfirmacao } from "../components/feedback/DialogoConfirmacao";

interface Pendente {
  opcoes: OpcoesConfirmacao;
  resolver: (confirmado: boolean) => void;
}

const MAXIMO_NA_TELA = 4;

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ToastItem[]>([]);
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const proximoId = useRef(1);
  const pendenteRef = useRef<Pendente | null>(null);

  const fechar = useCallback((id: number) => {
    setItens((atuais) => atuais.filter((item) => item.id !== id));
  }, []);

  const exibir = useCallback((tipo: TipoToast, mensagem: string) => {
    const id = proximoId.current++;

    setItens((atuais) => [
      ...atuais.slice(-(MAXIMO_NA_TELA - 1)),
      { id, tipo, mensagem },
    ]);
  }, []);

  const confirmar = useCallback(
    (opcoes: OpcoesConfirmacao) =>
      new Promise<boolean>((resolve) => {
        // Uma pergunta nova cancela a que ainda estava aberta.
        pendenteRef.current?.resolver(false);

        const item: Pendente = { opcoes, resolver: resolve };

        pendenteRef.current = item;
        setPendente(item);
      }),
    [],
  );

  const responder = useCallback((confirmado: boolean) => {
    const atual = pendenteRef.current;

    pendenteRef.current = null;
    setPendente(null);
    atual?.resolver(confirmado);
  }, []);

  // Identidade estável: as telas podem usar estas funções em dependências de
  // efeitos sem disparar recargas.
  const valor = useMemo(
    () => ({
      toast: {
        sucesso: (mensagem: string) => exibir("sucesso", mensagem),
        erro: (mensagem: string) => exibir("erro", mensagem),
        aviso: (mensagem: string) => exibir("aviso", mensagem),
      },
      confirmar,
    }),
    [exibir, confirmar],
  );

  return (
    <NotificacoesContext.Provider value={valor}>
      {children}

      <Toasts
        itens={itens}
        aoFechar={fechar}
      />

      {pendente && (
        <DialogoConfirmacao
          opcoes={pendente.opcoes}
          aoResponder={responder}
        />
      )}
    </NotificacoesContext.Provider>
  );
}
