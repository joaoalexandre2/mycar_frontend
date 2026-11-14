import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { podeVerMenu } from "../../utils/permissoes";

/**
 * Esconde a tela de um menu da frota de quem não tem esse menu liberado. Fora da
 * frota, o usuário não tem lista de menus e passa direto. É só conveniência de
 * navegação: o backend é quem decide o acesso aos dados.
 */
export function MenuRoute({ menu }: { menu: string }) {
  const { usuario } = useAuth();

  if (!podeVerMenu(usuario, menu)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
