import type { Usuario } from "../types/auth";

/**
 * Se a pessoa pode fazer algo na frota (pelo papel ou por um grupo). Só decide o
 * que mostrar: o backend é quem barra. Sessão antiga, sem a lista, mostra tudo.
 */
export function podeNaFrota(usuario: Usuario | null | undefined, permissao: string): boolean {
  if (!usuario?.permissoes) return true;

  return usuario.permissoes.includes(permissao);
}
