import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";

import { Dashboard } from "./components/dashboard/Dashboard";

import { Clientes } from "./pages/Clientes/Clientes";
import { Veiculos } from "./pages/Veiculos/Veiculos";
import { OrdensServico } from "./pages/OrdensServico/OrdensServico";
import { Manutencoes } from "./pages/Manutencoes/Manutencoes";
import { Configuracoes } from "./pages/Configuracoes/Configuracoes";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />

        <main className="ml-[250px] min-h-screen">
          <Header />

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
    </BrowserRouter>
  );
}

export default App;