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

import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";

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

function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        aberta={menuAberto}
        aoFechar={() => setMenuAberto(false)}
      />

      <main className="min-h-screen md:ml-[250px] print:ml-0">
        <Header aoAbrirMenu={() => setMenuAberto(true)} />

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
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
