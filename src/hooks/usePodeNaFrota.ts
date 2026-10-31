import { useContext } from "react";
import { AuthContext } from "../contexts/authContextDefinition";
import { podeNaFrota } from "../utils/permissoes";

/**
 * Se a pessoa logada pode fazer algo na frota. Fora de um AuthProvider não
 * esconde nada: quem barra é o backend.
 */
export function usePodeNaFrota() {
  const usuario = useContext(AuthContext)?.usuario;

  return (permissao: string) => podeNaFrota(usuario, permissao);
}
