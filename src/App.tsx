import { lazy, Suspense, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import { useTelaGrande } from "./hooks/useTelaGrande";

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
const LoginSocial = lazy(() =>
  import("./pages/Login/LoginSocial").then((m) => ({ default: m.LoginSocial })),
);
const Privacidade = lazy(() =>
  import("./pages/Legal/Privacidade").then((m) => ({ default: m.Privacidade })),
);
const Termos = lazy(() =>
  import("./pages/Legal/Termos").then((m) => ({ default: m.Termos })),
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

export function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { usuario } = useAuth();
  const telaGrande = useTelaGrande();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Primeiro item da tabulação: quem usa teclado pula o menu a cada página. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg print:hidden"
      >
        Pular para o conteúdo
      </a>

      <Sidebar
        aberta={menuAberto}
        aoFechar={() => setMenuAberto(false)}
      />

      {/* Com o menu aberto no celular, o que está atrás dele não recebe foco. O
          cabeçalho fica fora do <main>, para ser o landmark "banner". */}
      <div
        inert={menuAberto && !telaGrande}
        className="flex min-h-screen flex-col md:ml-[250px] print:ml-0"
      >
        <Header
          aoAbrirMenu={() => setMenuAberto(true)}
          menuAberto={menuAberto}
        />

        {/* Menu e cabeçalho ficam na tela enquanto o pacote do perfil chega. */}
        <main
          id="conteudo"
          tabIndex={-1}
          className="flex-1 outline-none"
        >
          <ErroDeTela>
            <Suspense fallback={<CarregandoTela />}>
              {ehConta(perfilDe(usuario)) ? <RotasConta /> : <RotasOficina />}
            </Suspense>
          </ErroDeTela>
        </main>
      </div>
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
                path="/login/social"
                element={<LoginSocial />}
              />

              <Route
                path="/privacidade"
                element={<Privacidade />}
              />

              <Route
                path="/termos"
                element={<Termos />}
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
