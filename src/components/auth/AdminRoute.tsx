import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Esconde as telas do operador da plataforma de quem não é administrador.
 * É só conveniência de navegação: o backend responde 403 a quem não é.
 */
export function AdminRoute() {
  const { usuario } = useAuth();

  if (!usuario?.admin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
