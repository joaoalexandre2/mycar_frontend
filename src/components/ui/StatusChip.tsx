import type { ReactNode } from "react";
import { CLASSES_DO_TOM, type Tom } from "./tons";

export type StatusChipTone = Tom;

/**
 * Pílula de status (agenda, manutenção, ordem de serviço, uso). O status vai
 * sempre por escrito em `children`: a cor só reforça, nunca é a única pista.
 */
export function StatusChip({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: StatusChipTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      data-tom={tone}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CLASSES_DO_TOM[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
