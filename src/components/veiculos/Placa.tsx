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
 *
 * As cores são fixas (hex), não bg-white/text-gray-*: o tema escuro inverte
 * essas classes e a placa ficava escura com letra clara. A placa de verdade
 * é sempre clara.
 */
export function Placa({ placa, uf, tamanho = "sm" }: PlacaProps) {
  const padrao = padraoDaPlaca(placa);
  const grande = tamanho === "md";

  if (padrao === null) {
    return (
      <span className="inline-block whitespace-nowrap rounded-md bg-[#ffffff] px-2 py-0.5 text-xs font-bold tracking-[0.18em] text-[#1a1a1a]">
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
        className="inline-flex shrink-0 flex-col overflow-hidden whitespace-nowrap rounded-[5px] border border-[#9ca3af] bg-[#ffffff] shadow-sm"
      >
        <span
          className={`flex items-center justify-between bg-[#1d4fa3] px-1.5 font-bold tracking-widest text-white uppercase ${
            grande ? "text-[8px] leading-4" : "text-[8px] leading-[11px]"
          }`}
        >
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#2fa84f]" />
          Brasil
          <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-[#f2c200]" />
        </span>
        <span
          className={`px-2 text-center font-bold tracking-[0.12em] text-[#1a1a1a] ${
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
      className="inline-flex shrink-0 flex-col overflow-hidden whitespace-nowrap rounded-[5px] border-2 border-[#374151] bg-[#c4c7cc] shadow-sm"
    >
      <span
        className={`bg-[#a9adb3] px-1.5 text-center font-semibold tracking-wider text-[#1f2937] uppercase ${
          grande ? "text-[8px] leading-4" : "text-[8px] leading-[11px]"
        }`}
      >
        {uf ? uf : "Brasil"}
      </span>
      <span
        className={`px-2 text-center font-bold tracking-[0.1em] text-[#1a1a1a] ${
          grande ? "py-1 text-lg" : "py-px text-[12px]"
        }`}
      >
        {texto}
      </span>
    </span>
  );
}
