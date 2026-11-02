const NOMES: Record<string, string> = {
  starter: "Starter",
  basico: "Básico",
  profissional: "Profissional",
  empresarial: "Empresarial",
};

/** Nome do plano comercial para mostrar na tela. Sem plano definido, a conta não tem limite. */
export function nomeDoPlano(plano: string | null | undefined): string {
  if (!plano) return "sem limite";

  return NOMES[plano] ?? plano;
}
