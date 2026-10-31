import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminRoute } from "../components/auth/AdminRoute";
import { FrotaRoute } from "../components/auth/FrotaRoute";
import { MenuRoute } from "../components/auth/MenuRoute";
import { ContaInicio } from "../pages/Conta/ContaInicio";
import { MeusVeiculos } from "../pages/Conta/MeusVeiculos";
import { Servicos } from "../pages/Conta/Servicos";
import { Pecas } from "../pages/Conta/Pecas";
import { FichaTecnica } from "../pages/Conta/FichaTecnica";
import { Comparador } from "../pages/Conta/Comparador";
import { Agenda } from "../pages/Frota/Agenda";
import { Cadastros } from "../pages/Frota/Cadastros";
import { Configuracoes } from "../pages/Configuracoes/Configuracoes";
import { Sugestoes } from "../pages/Sugestoes/Sugestoes";

const Admin = lazy(() =>
  import("../pages/Admin/Admin").then((m) => ({ default: m.Admin })),
);

/** Telas dos perfis Cuidados com seu carro (pessoa) e Frota. */
export default function RotasConta() {
  return (
    <Routes>
      <Route
        path="/"
        element={<ContaInicio />}
      />

      <Route
        path="/veiculos"
        element={<MeusVeiculos />}
      />

      <Route
        path="/servicos"
        element={<Servicos />}
      />

      <Route
        path="/pecas"
        element={<Pecas />}
      />

      <Route
        path="/ficha-tecnica"
        element={<FichaTecnica />}
      />

      <Route
        path="/comparador"
        element={<Comparador />}
      />

      {/* Só o perfil frota: agenda de uso dos veículos, motoristas e centros de custo. */}
      <Route element={<FrotaRoute />}>
        <Route element={<MenuRoute menu="agenda" />}>
          <Route
            path="/agenda"
            element={<Agenda />}
          />
        </Route>

        <Route
          path="/frota/cadastros"
          element={<Cadastros />}
        />
      </Route>

      <Route
        path="/sugestoes"
        element={<Sugestoes />}
      />

      <Route
        path="/configuracoes"
        element={<Configuracoes />}
      />

      {/* O operador da plataforma segue com a Administração mesmo usando outro perfil. */}
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
