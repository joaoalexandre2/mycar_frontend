import type { ReactNode, Ref } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { CLASSES_DO_TOM } from "./tons";

export type AlertTone = "danger" | "warning" | "success" | "info";

const ICONE: Record<AlertTone, LucideIcon> = {
  danger: CircleAlert,
  warning: TriangleAlert,
  success: CircleCheck,
  info: Info,
};

/**
 * Mensagem de erro, aviso, sucesso ou informação, sempre numa caixa.
 *
 * Erro sai com role="alert" (o leitor de tela interrompe e lê na hora); os
 * demais com role="status" (lido quando houver uma pausa). Os dois papéis já
 * trazem o aria-live certo (assertive e polite); repetir o atributo faz alguns
 * leitores anunciarem duas vezes.
 */
export function Alert({
  tone = "danger",
  children,
  className = "",
  id,
  icon = true,
  action,
  ref,
  tabIndex,
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
  /** Para ligar a mensagem a um campo com aria-describedby. */
  id?: string;
  /** Ícone do tom à esquerda (decorativo: o texto é quem diz o que houve). */
  icon?: boolean;
  /** Um botão dentro da mensagem, como "Tentar de novo". */
  action?: { label: ReactNode; onClick: () => void; disabled?: boolean };
  /** Para levar o foco até a mensagem (com tabIndex={-1}). */
  ref?: Ref<HTMLDivElement>;
  tabIndex?: number;
}) {
  const Icone = ICONE[tone];

  return (
    <div
      ref={ref}
      id={id}
      tabIndex={tabIndex}
      role={tone === "danger" ? "alert" : "status"}
      data-tom={tone}
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-xs ${CLASSES_DO_TOM[tone]} ${className}`}
    >
      {icon && <Icone size={16} aria-hidden="true" className="shrink-0" />}

      {action ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="min-w-0">{children}</div>
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled}
            className="h-11 shrink-0 font-semibold underline disabled:opacity-60 md:h-auto"
          >
            {action.label}
          </button>
        </div>
      ) : (
        <div className="min-w-0 flex-1">{children}</div>
      )}
    </div>
  );
}
