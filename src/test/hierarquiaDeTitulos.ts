import { expect } from "vitest";

/** Os títulos da tela na ordem do documento, fora das janelas (modais têm a própria hierarquia). */
export function titulosDaTela(raiz: ParentNode = document.body): { nivel: number; texto: string }[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"))
    .filter((titulo) => !titulo.closest("[role='dialog']"))
    .map((titulo) => ({ nivel: Number(titulo.tagName.slice(1)), texto: titulo.textContent?.trim() ?? "" }));
}

/**
 * Confere a regra dos títulos: o h1 é só do cabeçalho, a página começa nas seções
 * (h2) e nenhum nível é pulado. Com `tituloDaPagina`, confere também que nenhum
 * título da página repete o h1.
 */
export function conferirHierarquiaDaPagina(raiz: ParentNode, tituloDaPagina?: string) {
  const titulos = titulosDaTela(raiz);
  let anterior = 1;

  for (const { nivel, texto } of titulos) {
    expect(nivel, `"${texto}" é h${nivel}: a página não tem h1`).toBeGreaterThan(1);
    expect(nivel, `"${texto}" é h${nivel} logo depois de um h${anterior}`).toBeLessThanOrEqual(anterior + 1);
    anterior = nivel;
  }

  if (tituloDaPagina) {
    expect(titulos.map((t) => t.texto)).not.toContain(tituloDaPagina);
  }
}
