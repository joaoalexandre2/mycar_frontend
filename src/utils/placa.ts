export type PadraoPlaca = "mercosul" | "antiga";

const ANTIGA = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

/** Deixa só letras e números, em maiúsculas, com no máximo 7 caracteres. */
export function limparPlaca(texto: string): string {
  return texto
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

/** 'mercosul' (ABC1D23), 'antiga' (ABC1234) ou null se não for uma placa completa e válida. */
export function padraoDaPlaca(placa: string): PadraoPlaca | null {
  const limpa = limparPlaca(placa);

  if (MERCOSUL.test(limpa)) return "mercosul";
  if (ANTIGA.test(limpa)) return "antiga";

  return null;
}

export function placaValida(placa: string): boolean {
  return padraoDaPlaca(placa) !== null;
}

/** ABC1234 vira ABC-1234; a Mercosul fica como está. */
export function formatarPlaca(placa: string): string {
  const limpa = limparPlaca(placa);

  return padraoDaPlaca(limpa) === "antiga"
    ? `${limpa.slice(0, 3)}-${limpa.slice(3)}`
    : limpa;
}

export const ROTULO_PADRAO: Record<PadraoPlaca, string> = {
  mercosul: "Padrão Mercosul",
  antiga: "Padrão antigo",
};
