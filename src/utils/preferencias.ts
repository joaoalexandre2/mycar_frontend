export type Tema = "claro" | "escuro";
export type Cor = "blue" | "green" | "purple" | "orange";

export const OPCOES_ITENS_POR_PAGINA = [10, 15, 20, 50, 100] as const;

const CHAVE_TEMA = "mycar_tema";
const CHAVE_COR = "mycar_cor";
const CHAVE_ITENS = "mycar_itens_por_pagina";

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // Sem armazenamento disponível: a preferência vale só nesta sessão.
  }
}

export function obterTema(): Tema {
  return ler(CHAVE_TEMA) === "escuro" ? "escuro" : "claro";
}

export function obterCor(): Cor {
  const cor = ler(CHAVE_COR);

  return cor === "green" || cor === "purple" || cor === "orange"
    ? cor
    : "blue";
}

export function obterItensPorPagina(): number {
  const valor = Number(ler(CHAVE_ITENS));

  return (OPCOES_ITENS_POR_PAGINA as readonly number[]).includes(valor)
    ? valor
    : 15;
}

export function salvarItensPorPagina(valor: number) {
  gravar(CHAVE_ITENS, String(valor));
}

export function aplicarAparencia(tema: Tema, cor: Cor) {
  const raiz = document.documentElement;

  raiz.classList.toggle("dark", tema === "escuro");
  raiz.dataset.cor = cor;
}

export function salvarAparencia(tema: Tema, cor: Cor) {
  gravar(CHAVE_TEMA, tema);
  gravar(CHAVE_COR, cor);
  aplicarAparencia(tema, cor);
}

export function aplicarAparenciaSalva() {
  aplicarAparencia(obterTema(), obterCor());
}
