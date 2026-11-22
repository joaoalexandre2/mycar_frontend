import { expect } from "vitest";

/**
 * Confere o contrato da classe `tabela-cartoes` (src/index.css), que no celular
 * esconde o cabeçalho e mostra o rótulo de cada célula a partir de `data-label`:
 *
 * - a tabela leva a classe;
 * - toda célula de dado tem `data-label` igual ao título da coluna (o <th> na
 *   mesma posição), senão o cartão fica com valores sem nome;
 * - a célula de ações (a que tem botões) fica sem `data-label`, que é o que a
 *   faz virar a faixa de botões no rodapé do cartão;
 * - a linha de "nada encontrado" ocupa todas as colunas com colSpan.
 */
export function conferirTabelaCartoes(tabela: HTMLTableElement) {
  expect(tabela).toHaveClass("tabela-cartoes");

  const titulos = Array.from(tabela.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "");
  const linhas = Array.from(tabela.querySelectorAll("tbody tr"));
  expect(linhas.length).toBeGreaterThan(0);

  for (const linha of linhas) {
    const celulas = Array.from(linha.querySelectorAll("td"));

    if (celulas.length === 1 && celulas[0].hasAttribute("colspan")) {
      expect(celulas[0].colSpan).toBe(titulos.length);
      continue;
    }

    expect(celulas).toHaveLength(titulos.length);

    celulas.forEach((td, indice) => {
      if (td.querySelector("button")) {
        expect(td).not.toHaveAttribute("data-label");
      } else {
        expect(td).toHaveAttribute("data-label", titulos[indice]);
      }
    });
  }
}
