import { useSyncExternalStore } from "react";

/** O mesmo ponto em que o Tailwind (`md:`) deixa o menu lateral fixo na tela. */
const CONSULTA = "(min-width: 768px)";

function assinar(aoMudar: () => void) {
  if (typeof window.matchMedia !== "function") {
    return () => {};
  }

  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener("change", aoMudar);

  return () => consulta.removeEventListener("change", aoMudar);
}

function lerAgora() {
  // Sem matchMedia (testes, navegadores muito antigos) vale o layout largo,
  // em que o menu nunca fica escondido.
  return typeof window.matchMedia !== "function"
    ? true
    : window.matchMedia(CONSULTA).matches;
}

/** Verdadeiro quando a tela é larga o bastante para o menu lateral ficar sempre à mostra. */
export function useTelaGrande() {
  return useSyncExternalStore(assinar, lerAgora, () => true);
}
