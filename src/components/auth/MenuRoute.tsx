import { Navigate, Outlet } from "react-router-dom";
import { usePodeVerMenu } from "../../hooks/usePodeNaFrota";

/**
 * Deixa a tela passar só se a pessoa vê o menu da frota (ex.: "agenda"). Sem
 * isso, o menu escondido na lateral ainda abriria pela URL. O backend é quem barra os dados.
 */
export function MenuRoute({ menu }: { menu: string }) {
  const podeVer = usePodeVerMenu();

  if (!podeVer(menu)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
