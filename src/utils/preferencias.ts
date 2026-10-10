import type { Usuario } from "../types/auth";
import { ehConta, perfilDe } from "./perfil";

export type Tema = "claro" | "escuro";
export type Cor = "blue" | "green" | "purple" | "orange" | "red";

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

  return cor === "green" || cor === "purple" || cor === "orange" || cor === "red"
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

/**
 * Estilo visual do app por perfil: "pista" em pessoa e frota (laranja, números
 * condensados) e "oficina" na oficina (azul-marinho, pensado para tabelas).
 */
export type Estilo = "pista" | "oficina";

/** Estilo do perfil do usuário; sem usuário, nenhum. */
export function estiloDoPerfil(usuario: Usuario | null | undefined): Estilo | null {
  if (!usuario) {
    return null;
  }

  return ehConta(perfilDe(usuario)) ? "pista" : "oficina";
}

/** Cor que o usuário já escolheu neste navegador; null se nunca escolheu. */
export function corSalva(): Cor | null {
  const cor = ler(CHAVE_COR);

  return cor === "blue" || cor === "green" || cor === "purple" || cor === "orange" || cor === "red"
    ? cor
    : null;
}

export function aplicarEstilo(estilo: Estilo | null) {
  const raiz = document.documentElement;

  if (estilo) {
    raiz.dataset.estilo = estilo;
  } else {
    delete raiz.dataset.estilo;
  }
}

/**
 * Aplica o que está salvo neste navegador, no estilo do perfil. No estilo Pista o
 * laranja é a cor padrão de quem nunca escolheu uma; nos demais, o azul.
 */
export function aplicarAparenciaSalva(estilo: Estilo | null = null) {
  aplicarEstilo(estilo);
  aplicarAparencia(obterTema(), corSalva() ?? (estilo === "pista" ? "orange" : "blue"));
}
