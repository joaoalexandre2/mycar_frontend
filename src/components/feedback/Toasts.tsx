import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, TriangleAlert, X } from "lucide-react";
import type { TipoToast } from "../../contexts/notificacoesDefinition";

export interface ToastItem {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

const DURACAO_MS: Record<TipoToast, number> = {
  sucesso: 4000,
  aviso: 6000,
  erro: 8000,
};

const ESTILO: Record<TipoToast, string> = {
  sucesso: "border-green-200 bg-green-50 text-green-900",
  aviso: "border-amber-200 bg-amber-50 text-amber-900",
  erro: "border-red-200 bg-red-50 text-red-900",
};

const ICONE = {
  sucesso: CircleCheck,
  aviso: TriangleAlert,
  erro: CircleAlert,
} as const;

function Toast({
  item,
  aoFechar,
}: {
  item: ToastItem;
  aoFechar: (id: number) => void;
}) {
  // Parado enquanto o mouse ou o foco estão no aviso, para dar tempo de ler.
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) {
      return;
    }

    const timer = setTimeout(() => aoFechar(item.id), DURACAO_MS[item.tipo]);

    return () => clearTimeout(timer);
  }, [item.id, item.tipo, aoFechar, pausado]);

  const Icone = ICONE[item.tipo];

  return (
    <div
      // Erros interrompem a leitura de tela; o resto espera a vez.
      role={item.tipo === "erro" ? "alert" : "status"}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${ESTILO[item.tipo]}`}
    >
      <Icone
        className="mt-0.5 h-4 w-4 shrink-0"
        aria-hidden="true"
      />

      <p className="min-w-0 flex-1 whitespace-pre-line break-words">
        {item.mensagem}
      </p>

      <button
        type="button"
        onClick={() => aoFechar(item.id)}
        aria-label="Fechar aviso"
        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
      >
        <X
          className="h-4 w-4"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export function Toasts({
  itens,
  aoFechar,
}: {
  itens: ToastItem[];
  aoFechar: (id: number) => void;
}) {
  if (itens.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-stretch gap-2 print:hidden sm:left-auto sm:right-4 sm:w-96">
      {itens.map((item) => (
        <Toast
          key={item.id}
          item={item}
          aoFechar={aoFechar}
        />
      ))}
    </div>
  );
}
