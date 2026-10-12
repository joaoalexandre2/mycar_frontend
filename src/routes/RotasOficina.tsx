import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminRoute } from "../components/auth/AdminRoute";
import { Dashboard } from "../components/dashboard/Dashboard";
import { Clientes } from "../pages/Clientes/Clientes";
import { Veiculos } from "../pages/Veiculos/Veiculos";
import { OrdensServico } from "../pages/OrdensServico/OrdensServico";
import { Manutencoes } from "../pages/Manutencoes/Manutencoes";
import { Configuracoes } from "../pages/Configuracoes/Configuracoes";
import { Sugestoes } from "../pages/Sugestoes/Sugestoes";

// A Administração é do operador da plataforma: quase ninguém abre, então fica
// fora do pacote do perfil.
const Admin = lazy(() =>
  import("../pages/Admin/Admin").then((m) => ({ default: m.Admin })),
);

/** Telas do perfil Oficina (MyCar Oficina). */
export default function RotasOficina() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Dashboard />}
      />

      <Route
        path="/clientes"
        element={<Clientes />}
      />

      <Route
        path="/veiculos"
        element={<Veiculos />}
      />

      <Route
        path="/ordens-servico"
        element={<OrdensServico />}
      />

      <Route
        path="/manutencoes"
        element={<Manutencoes />}
      />

      <Route
        path="/sugestoes"
        element={<Sugestoes />}
      />

      <Route
        path="/configuracoes"
        element={<Configuracoes />}
      />

      <Route element={<AdminRoute />}>
        <Route
          path="/admin"
          element={<Admin />}
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}
