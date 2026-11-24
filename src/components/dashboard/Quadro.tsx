import type { ReactNode } from "react";

/** Quadro de número grande (estilo Pista): título pequeno, valor em fonte condensada. */
export function Quadro({
  titulo,
  valor,
  detalhe,
  tom = "normal",
  tituloCurto,
  compactoNoCelular = false,
}: {
  titulo: string;
  valor: ReactNode;
  detalhe?: string;
  /** "alerta" pinta o número no tom warning (âmbar); "perigo" no danger (vermelho). */
  tom?: "normal" | "alerta" | "perigo";
  /**
   * Rótulo que aparece no lugar do título abaixo de `md`, para caber numa linha
   * em meia largura. O título completo continua para o leitor de tela.
   */
  tituloCurto?: string;
  /**
   * Abaixo de `md`: menos respiro e o detalhe só para o leitor de tela. A partir
   * de `md` o quadro fica igual ao normal.
   */
  compactoNoCelular?: boolean;
}) {
  const cor =
    tom === "perigo"
      ? "text-(--tom-danger-texto)"
      : tom === "alerta"
        ? "text-(--tom-warning-texto)"
        : "text-gray-900";

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 ${compactoNoCelular ? "max-md:p-3" : ""}`}
    >
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
        {tituloCurto ? (
          <>
            <span className="max-md:sr-only">{titulo}</span>
            <span aria-hidden="true" className="md:hidden">
              {tituloCurto}
            </span>
          </>
        ) : (
          titulo
        )}
      </p>
      <div className="valor-fluido-pai mt-1">
        <p className={`font-display valor-fluido leading-none font-bold ${cor}`}>
          {valor}
        </p>
      </div>
      {detalhe && (
        <p className={`mt-1.5 text-xs text-gray-500 ${compactoNoCelular ? "max-md:sr-only" : ""}`}>
          {detalhe}
        </p>
      )}
    </div>
  );
}
