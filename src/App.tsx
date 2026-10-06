import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { useAuth } from "./hooks/useAuth";

import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { AparenciaDoUsuario } from "./components/layout/AparenciaDoUsuario";

import { Dashboard } from "./components/dashboard/Dashboard";

import { Login } from "./pages/Login/Login";
import { Register } from "./pages/Register/Register";
import { EmailConfirmado } from "./pages/EmailConfirmado/EmailConfirmado";
import { EsqueciSenha } from "./pages/EsqueciSenha/EsqueciSenha";
import { RedefinirSenha } from "./pages/RedefinirSenha/RedefinirSenha";
import { Clientes } from "./pages/Clientes/Clientes";
import { Veiculos } from "./pages/Veiculos/Veiculos";
import { OrdensServico } from "./pages/OrdensServico/OrdensServico";
import { Manutencoes } from "./pages/Manutencoes/Manutencoes";
import { Configuracoes } from "./pages/Configuracoes/Configuracoes";
import { Admin } from "./pages/Admin/Admin";
import { ContaInicio } from "./pages/Conta/ContaInicio";
import { MeusVeiculos } from "./pages/Conta/MeusVeiculos";
import { Servicos } from "./pages/Conta/Servicos";
import { Pecas } from "./pages/Conta/Pecas";
import { ehConta, perfilDe } from "./utils/perfil";

/** Telas do perfil Oficina (MyCar Oficina). */
function RotasOficina() {
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

/** Telas dos perfis Cuidados com seu carro (pessoa) e Frota. */
function RotasConta() {
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

function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { usuario } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        aberta={menuAberto}
        aoFechar={() => setMenuAberto(false)}
      />

      <main className="min-h-screen md:ml-[250px] print:ml-0">
        <Header aoAbrirMenu={() => setMenuAberto(true)} />

        {ehConta(perfilDe(usuario)) ? <RotasConta /> : <RotasOficina />}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AparenciaDoUsuario />

        <Routes>
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/registrar"
            element={<Register />}
          />

          <Route
            path="/email-confirmado"
            element={<EmailConfirmado />}
          />

          <Route
            path="/esqueci-senha"
            element={<EsqueciSenha />}
          />

          <Route
            path="/redefinir-senha"
            element={<RedefinirSenha />}
          />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/*"
              element={<AppLayout />}
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
