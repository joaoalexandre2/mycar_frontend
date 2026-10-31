import type { Usuario } from "../types/auth";

/**
 * Se a pessoa pode fazer algo na frota (pelo papel ou por um grupo). Só decide o
 * que mostrar: o backend é quem barra. Sessão antiga, sem a lista, mostra tudo.
 */
export function podeNaFrota(usuario: Usuario | null | undefined, permissao: string): boolean {
  if (!usuario?.permissoes) return true;

  return usuario.permissoes.includes(permissao);
}

/**
 * Se o menu da frota aparece para a pessoa (só aparece se um grupo liberar, ou se for administrador). Só
 * decide o que mostrar: a API barra as rotas. Sessão antiga, sem a lista, mostra tudo.
 */
export function podeVerMenu(usuario: Usuario | null | undefined, menu: string): boolean {
  if (!usuario?.menus) return true;

  return usuario.menus.includes(menu);
}
