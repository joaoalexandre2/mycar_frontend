import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ehAdministradorOuGestor } from "../../utils/permissoes";

/**
 * Esconde as configurações da frota de quem não é administrador nem gestor.
 * É só conveniência de navegação: o backend barra as rotas de cada cadastro.
 */
export function FrotaGestorRoute() {
  const { usuario } = useAuth();

  if (!ehAdministradorOuGestor(usuario)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
