import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { perfilDe } from "../../utils/perfil";

/**
 * Esconde as telas da frota (agenda, motoristas, centros de custo) de quem usa
 * outro perfil. É só conveniência de navegação: o backend responde 403.
 */
export function FrotaRoute() {
  const { usuario } = useAuth();

  if (perfilDe(usuario) !== "frota") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
