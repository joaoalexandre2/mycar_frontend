import { lazy, Suspense, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { AparenciaDoUsuario } from "./components/layout/AparenciaDoUsuario";
import { CarregandoTela } from "./components/layout/CarregandoTela";
import { ErroDeTela } from "./components/layout/ErroDeTela";

import { Login } from "./pages/Login/Login";
import { ehConta, perfilDe } from "./utils/perfil";

// Cada perfil vira um pacote próprio: quem usa a oficina não baixa as telas de
// "Cuidados com seu carro" (e vice-versa), e quem ainda vai entrar só baixa o login.
const RotasOficina = lazy(() => import("./routes/RotasOficina"));
const RotasConta = lazy(() => import("./routes/RotasConta"));

// Telas públicas pouco acessadas: fora do pacote inicial do login.
const Register = lazy(() =>
  import("./pages/Register/Register").then((m) => ({ default: m.Register })),
);
const EmailConfirmado = lazy(() =>
  import("./pages/EmailConfirmado/EmailConfirmado").then((m) => ({
    default: m.EmailConfirmado,
  })),
);
const EsqueciSenha = lazy(() =>
  import("./pages/EsqueciSenha/EsqueciSenha").then((m) => ({
    default: m.EsqueciSenha,
  })),
);
const RedefinirSenha = lazy(() =>
  import("./pages/RedefinirSenha/RedefinirSenha").then((m) => ({
    default: m.RedefinirSenha,
  })),
);

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

        {/* Menu e cabeçalho ficam na tela enquanto o pacote do perfil chega. */}
        <ErroDeTela>
          <Suspense fallback={<CarregandoTela />}>
            {ehConta(perfilDe(usuario)) ? <RotasConta /> : <RotasOficina />}
          </Suspense>
        </ErroDeTela>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AparenciaDoUsuario />

        <ErroDeTela>
          <Suspense fallback={<CarregandoTela />}>
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
          </Suspense>
        </ErroDeTela>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
