import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { perfilDe } from "../../utils/perfil";

/** As telas do pátio são só do perfil Estética. Os demais voltam ao início. */
export function EsteticaRoute() {
  const { usuario } = useAuth();

  if (perfilDe(usuario) !== "estetica") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
