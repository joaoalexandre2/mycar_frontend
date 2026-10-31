import { useContext } from "react";
import { AuthContext } from "../contexts/authContextDefinition";
import { podeNaFrota, podeVerMenu } from "../utils/permissoes";

/**
 * Se a pessoa logada pode fazer algo na frota. Fora de um AuthProvider não
 * esconde nada: quem barra é o backend.
 */
export function usePodeNaFrota() {
  const usuario = useContext(AuthContext)?.usuario;

  return (permissao: string) => podeNaFrota(usuario, permissao);
}

/** Se o menu da frota aparece para a pessoa logada. Fora de um AuthProvider não bloqueia nada. */
export function usePodeVerMenu() {
  const usuario = useContext(AuthContext)?.usuario;

  return (menu: string) => podeVerMenu(usuario, menu);
}

/** Quem está logado, ou null fora de um AuthProvider (a tela só esconde; o backend barra). */
export function useUsuarioDaFrota() {
  return useContext(AuthContext)?.usuario ?? null;
}
