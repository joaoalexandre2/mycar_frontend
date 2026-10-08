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
  /** "alerta" pinta o número na cor principal; "perigo" em vermelho. */
  tom?: "normal" | "alerta" | "perigo";
}) {
  const cor =
    tom === "perigo"
      ? "text-red-600"
      : tom === "alerta"
        ? "text-blue-600"
        : "text-gray-900";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase">
        {titulo}
      </p>
      <p className={`font-display mt-1 text-[30px] leading-none font-bold ${cor}`}>
        {valor}
      </p>
      {detalhe && <p className="mt-1.5 text-[11px] text-gray-400">{detalhe}</p>}
    </div>
  );
}
