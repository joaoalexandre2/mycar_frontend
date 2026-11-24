import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Lido do disco: no Vitest o CSS importado (mesmo com ?raw) chega vazio. O
// Vitest roda a partir da raiz do projeto.
const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

// O jsdom não avalia media query nem pseudo-elemento: aqui só se confere que
// as regras existem no CSS-fonte e estão dentro de @media (pointer: coarse).
// O tamanho real do toque só se confirma no celular.

/** Corpo do primeiro bloco @media (pointer: coarse) que contém o trecho. */
function blocoDeToqueCom(trecho: string): string | undefined {
  const marcador = "@media (pointer: coarse) {";
  let inicio = css.indexOf(marcador);

  while (inicio !== -1) {
    let nivel = 0;
    let fim = inicio + marcador.length - 1;

    for (; fim < css.length; fim++) {
      if (css[fim] === "{") nivel++;
      if (css[fim] === "}" && --nivel === 0) break;
    }

    const corpo = css.slice(inicio, fim + 1);
    if (corpo.includes(trecho)) return corpo;
    inicio = css.indexOf(marcador, fim);
  }

  return undefined;
}

describe("alvos de toque em index.css", () => {
  it("a classe alvo-de-toque só vale em tela de toque e estende a área a 44px", () => {
    const bloco = blocoDeToqueCom(".alvo-de-toque::after");

    expect(bloco).toBeDefined();
    expect(bloco).toContain("width: max(100%, 44px)");
    expect(bloco).toContain("height: max(100%, 44px)");
  });

  it("a regra global é estrita: ícone puro, rotulado, e fora do cabeçalho, chips e texto corrido", () => {
    const bloco = blocoDeToqueCom('[role="button"])[aria-label]:has(> svg:only-child)');

    expect(bloco).toBeDefined();
    expect(bloco).toContain(":not(header *, p *, [data-chip] *, .sem-alvo-de-toque)");
  });

  it("o contorno de foco global continua lá", () => {
    expect(css).toMatch(/:focus-visible\s*\{\s*outline: 2px solid var\(--color-blue-600\);/);
    expect(css).not.toMatch(/:focus-visible\s*\{[^}]*outline:\s*(none|0)/);
  });
});
