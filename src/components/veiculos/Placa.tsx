import { formatarPlaca, limparPlaca, padraoDaPlaca } from "../../utils/placa";

interface PlacaProps {
  placa: string;
  /** Estado de emplacamento: aparece na faixa da placa antiga. */
  uf?: string | null;
  /** "sm" para listas e selos; "md" para destaque. */
  tamanho?: "sm" | "md";
}

/**
 * Desenha a placa no padrão do veículo: Mercosul (branca, faixa azul com
 * BRASIL) ou antiga (cinza, com o estado em cima). Texto que não é uma placa
 * válida (dado antigo) aparece como um selo simples.
 */
export function Placa({ placa, uf, tamanho = "sm" }: PlacaProps) {
  const padrao = padraoDaPlaca(placa);
  const grande = tamanho === "md";

  if (padrao === null) {
    return (
      <span className="inline-block rounded-md bg-white px-2 py-0.5 text-[11px] font-bold tracking-[0.18em] text-gray-900">
        {placa}
      </span>
    );
  }

  const texto = padrao === "antiga" ? formatarPlaca(placa) : limparPlaca(placa);

  if (padrao === "mercosul") {
    return (
      <span
        role="img"
        aria-label={`Placa Mercosul ${texto}`}
        className="inline-flex flex-col overflow-hidden rounded-[5px] border border-gray-400 bg-white shadow-sm"
      >
        <span
          className={`flex items-center justify-between bg-[#1d4fa3] px-1.5 font-bold tracking-widest text-white uppercase ${
            grande ? "text-[8px] leading-4" : "text-[6px] leading-[10px]"
          }`}
        >
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#2fa84f]" />
          Brasil
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#f2c200]" />
        </span>
        <span
          className={`px-2 text-center font-bold tracking-[0.12em] text-gray-900 ${
            grande ? "py-1 text-lg" : "py-px text-[12px]"
          }`}
        >
          {texto}
        </span>
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={`Placa ${texto}`}
      className="inline-flex flex-col overflow-hidden rounded-[5px] border-2 border-gray-700 bg-[#c4c7cc] shadow-sm"
    >
      <span
        className={`bg-[#a9adb3] px-1.5 text-center font-semibold tracking-wider text-gray-800 uppercase ${
          grande ? "text-[8px] leading-4" : "text-[6px] leading-[10px]"
        }`}
      >
        {uf ? uf : "Brasil"}
      </span>
      <span
        className={`px-2 text-center font-bold tracking-[0.1em] text-gray-950 ${
          grande ? "py-1 text-lg" : "py-px text-[12px]"
        }`}
      >
        {texto}
      </span>
    </span>
  );
}
