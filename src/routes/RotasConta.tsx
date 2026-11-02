import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminRoute } from "../components/auth/AdminRoute";
import { FrotaRoute } from "../components/auth/FrotaRoute";
import { FrotaGestorRoute } from "../components/auth/FrotaGestorRoute";
import { EsteticaRoute } from "../components/auth/EsteticaRoute";
import { useAuth } from "../hooks/useAuth";
import { Patio } from "../pages/Estetica/Patio";
import { ServicosEPacotes } from "../pages/Estetica/ServicosEPacotes";
import { HistoricoPlaca } from "../pages/Estetica/HistoricoPlaca";
import { Financeiro } from "../pages/Estetica/Financeiro";
import { ContaInicio } from "../pages/Conta/ContaInicio";
import { MeusVeiculos } from "../pages/Conta/MeusVeiculos";
import { Servicos } from "../pages/Conta/Servicos";
import { Pecas } from "../pages/Conta/Pecas";
import { FichaTecnica } from "../pages/Conta/FichaTecnica";
import { Comparador } from "../pages/Conta/Comparador";
import { Agenda } from "../pages/Frota/Agenda";
import { Cadastros } from "../pages/Frota/Cadastros";
import { ConfiguracoesFrota } from "../pages/Frota/ConfiguracoesFrota";
import { PainelFrota } from "../pages/Frota/PainelFrota";
import { Multas } from "../pages/Frota/Multas";
import { Financeiro as FinanceiroDaFrota } from "../pages/Frota/Financeiro";
import { QrVeiculoPagina } from "../pages/Frota/QrVeiculoPagina";
import { Configuracoes } from "../pages/Configuracoes/Configuracoes";
import { Sugestoes } from "../pages/Sugestoes/Sugestoes";

const Admin = lazy(() =>
  import("../pages/Admin/Admin").then((m) => ({ default: m.Admin })),
);

/** Telas dos perfis Cuidados com seu carro (pessoa) e Frota. */
/** No início, a Estética vai direto para o pátio; os outros perfis veem a tela de conta. */
function InicioDaConta() {
  const { usuario } = useAuth();

  if (usuario?.perfil === "estetica") {
    return <Navigate to="/estetica" replace />;
  }

  return <ContaInicio />;
}

export default function RotasConta() {
  return (
    <Routes>
      <Route
        path="/"
        element={<InicioDaConta />}
      />

      {/* Estética: pátio em etapas, serviços, histórico por placa e financeiro. */}
      <Route element={<EsteticaRoute />}>
        <Route
          path="/estetica"
          element={<Patio />}
        />
        <Route
          path="/estetica/servicos"
          element={<ServicosEPacotes />}
        />
        <Route
          path="/estetica/placas"
          element={<HistoricoPlaca />}
        />
        <Route
          path="/estetica/financeiro"
          element={<Financeiro />}
        />
      </Route>

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
        <Route
          path="/agenda"
          element={<Agenda />}
        />

        <Route
          path="/frota/cadastros"
          element={<Cadastros />}
        />

        {/* QR Code do veículo: quem escaneia cai aqui, com as reservas de hoje. */}
        <Route
          path="/qr/:token"
          element={<QrVeiculoPagina />}
        />

        {/* Gestão da frota: só administrador e gestor. */}
        <Route element={<FrotaGestorRoute />}>
          <Route
            path="/frota/configuracoes"
            element={<ConfiguracoesFrota />}
          />
          <Route
            path="/frota/painel"
            element={<PainelFrota />}
          />
          <Route
            path="/frota/multas"
            element={<Multas />}
          />
          <Route
            path="/frota/financeiro"
            element={<FinanceiroDaFrota />}
          />
        </Route>
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
