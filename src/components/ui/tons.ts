/**
 * Tons de mensagem e de status. As cores vêm das variáveis --tom-* de
 * src/index.css, que mudam entre o tema claro e o escuro (o contraste de cada
 * par está anotado lá). Nenhum tom usa a escala "blue", que é a cor da marca.
 */
export type Tom = "neutral" | "info" | "success" | "warning" | "danger";

/** Fundo, borda e texto de cada tom (classes literais para o Tailwind achar). */
export const CLASSES_DO_TOM: Record<Tom, string> = {
  neutral: "border-(--tom-neutral-borda) bg-(--tom-neutral-fundo) text-(--tom-neutral-texto)",
  info: "border-(--tom-info-borda) bg-(--tom-info-fundo) text-(--tom-info-texto)",
  success: "border-(--tom-success-borda) bg-(--tom-success-fundo) text-(--tom-success-texto)",
  warning: "border-(--tom-warning-borda) bg-(--tom-warning-fundo) text-(--tom-warning-texto)",
  danger: "border-(--tom-danger-borda) bg-(--tom-danger-fundo) text-(--tom-danger-texto)",
};
