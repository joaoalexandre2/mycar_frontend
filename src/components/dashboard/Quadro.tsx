import type { ReactNode } from "react";

/** Quadro de número grande (estilo Pista): título pequeno, valor em fonte condensada. */
export function Quadro({
  titulo,
  valor,
  detalhe,
  tom = "normal",
}: {
  titulo: string;
  valor: ReactNode;
  detalhe?: string;
  /** "alerta" pinta o número em âmbar; "perigo" em vermelho. */
  tom?: "normal" | "alerta" | "perigo";
}) {
  const cor =
    tom === "perigo"
      ? "text-red-600"
      : tom === "alerta"
        ? "text-amber-700"
        : "text-gray-900";

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
        {titulo}
      </p>
      <div className="valor-fluido-pai mt-1">
        <p className={`font-display valor-fluido leading-none font-bold ${cor}`}>
          {valor}
        </p>
      </div>
      {detalhe && <p className="mt-1.5 text-xs text-gray-500">{detalhe}</p>}
    </div>
  );
}
