import {
  CONSUMO_MAXIMO_KM_L,
  arcoDoSemicirculo,
  fracaoDaEscala,
  marcasDaEscala,
} from "../../utils/velocimetro";

const CX = 100;
const CY = 100;
const RAIO = 80;

/**
 * Velocímetro do consumo médio (km/l). O arco de cor usa a "cor principal" do
 * usuário (a escala blue, remapeada por data-cor). Sem dado (valor nulo), mostra a
 * escala vazia e um traço no lugar do número.
 */
export function Velocimetro({
  valor,
  unidade = "km por litro",
}: {
  valor: number | null;
  unidade?: string;
}) {
  const fracao = fracaoDaEscala(valor);
  const marcas = marcasDaEscala(CX, CY, RAIO + 10, RAIO + 4, [0, 0.25, 0.5, 0.75, 1]);

  return (
    <div className="relative">
      <svg
        viewBox="0 0 200 118"
        className="w-full"
        role="img"
        aria-label={
          valor === null
            ? "Consumo médio ainda sem dados"
            : `Consumo médio de ${valor.toLocaleString("pt-BR")} quilômetros por litro`
        }
      >
        <path
          d={arcoDoSemicirculo(CX, CY, RAIO, 1)}
          fill="none"
          stroke="#2A323C"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {fracao > 0 && (
          <path
            d={arcoDoSemicirculo(CX, CY, RAIO, fracao)}
            fill="none"
            stroke="var(--color-blue-500)"
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}

        <g stroke="#4B5663" strokeWidth="2" strokeLinecap="round">
          {marcas.map((m) => (
            <line key={m.fracao} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} />
          ))}
        </g>

        <g fill="#9AA3AE" fontSize="9" textAnchor="middle">
          <text x="20" y="116">0</text>
          <text x="100" y="12">{CONSUMO_MAXIMO_KM_L / 2}</text>
          <text x="180" y="116">{CONSUMO_MAXIMO_KM_L}</text>
        </g>
      </svg>

      <div className="absolute inset-x-0 bottom-3 text-center">
        <p className="font-display text-5xl leading-none font-bold text-white">
          {valor === null ? "—" : valor.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </p>
        <p className="mt-1 text-[10px] tracking-[0.12em] text-[#9AA3AE] uppercase">
          {unidade}
        </p>
      </div>
    </div>
  );
}
