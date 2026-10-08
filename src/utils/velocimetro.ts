/** Escala do velocímetro de consumo: de 0 a 20 km/l (acima disso o ponteiro trava no fim). */
export const CONSUMO_MAXIMO_KM_L = 20;

/** Posição do valor na escala, de 0 a 1. Valor ausente ou negativo fica em 0. */
export function fracaoDaEscala(valor: number | null | undefined, maximo = CONSUMO_MAXIMO_KM_L): number {
  if (valor === null || valor === undefined || Number.isNaN(valor) || valor <= 0) {
    return 0;
  }

  return Math.min(valor / maximo, 1);
}

/** Ponto do semicírculo (esquerda = 0, topo = 0,5, direita = 1), com o eixo y do SVG. */
export function pontoDoSemicirculo(cx: number, cy: number, raio: number, fracao: number) {
  const angulo = Math.PI * (1 - Math.min(Math.max(fracao, 0), 1));

  return {
    x: cx + raio * Math.cos(angulo),
    y: cy - raio * Math.sin(angulo),
  };
}

function arredondar(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Caminho SVG de um arco do semicírculo, do começo da escala até `fracao`.
 * Com fração 0 devolve um traço de comprimento zero (nada aparece).
 */
export function arcoDoSemicirculo(cx: number, cy: number, raio: number, fracao: number): string {
  const inicio = pontoDoSemicirculo(cx, cy, raio, 0);
  const fim = pontoDoSemicirculo(cx, cy, raio, fracao);

  return `M ${arredondar(inicio.x)} ${arredondar(inicio.y)} A ${raio} ${raio} 0 0 1 ${arredondar(fim.x)} ${arredondar(fim.y)}`;
}

/** Marcas da escala: de `de` a `ate` do raio, nas frações pedidas. */
export function marcasDaEscala(
  cx: number,
  cy: number,
  raioExterno: number,
  raioInterno: number,
  fracoes: number[],
) {
  return fracoes.map((fracao) => {
    const externo = pontoDoSemicirculo(cx, cy, raioExterno, fracao);
    const interno = pontoDoSemicirculo(cx, cy, raioInterno, fracao);

    return {
      fracao,
      x1: arredondar(externo.x),
      y1: arredondar(externo.y),
      x2: arredondar(interno.x),
      y2: arredondar(interno.y),
    };
  });
}
