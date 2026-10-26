import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Car, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { authService, type ProvedorSocial } from "../../services/auth";
import { mensagemErro } from "../../services/api";

export function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [precisaConfirmarEmail, setPrecisaConfirmarEmail] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [reenviado, setReenviado] = useState(false);
  const [socialEnviando, setSocialEnviando] = useState<ProvedorSocial | null>(null);

  const estadoRota = location.state as { from?: string } | null;
  const destino = estadoRota?.from ?? "/";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setPrecisaConfirmarEmail(false);
    setReenviado(false);
    setEnviando(true);

    try {
      await entrar({ email, password: senha });
      navigate(destino, { replace: true });
    } catch (error) {
      const mensagem = mensagemErro(error);
      setErro(mensagem);
      setPrecisaConfirmarEmail(mensagem.toLowerCase().includes("confirme seu e-mail"));
    } finally {
      setEnviando(false);
    }
  }

  async function handleSocial(provedor: ProvedorSocial) {
    setErro(null);
    setSocialEnviando(provedor);

    try {
      window.location.href = await authService.urlLoginSocial(provedor);
    } catch (error) {
      setErro(mensagemErro(error));
      setSocialEnviando(null);
    }
  }

  async function handleReenviar() {
    setReenviando(true);

    try {
      await authService.reenviarConfirmacao(email);
    } finally {
      // A API nunca revela se o e-mail existe, então sempre mostramos a
      // mesma confirmação de que a solicitação foi enviada.
      setReenviado(true);
      setReenviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Car size={22} />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">MyCar</h1>

            <p className="mt-1 text-sm text-gray-500">
              Entre para acessar o sistema
            </p>
          </div>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
        >
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block text-xs font-semibold text-gray-600"
            >
              E-mail
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-500">
              <Mail
                size={16}
                className="text-gray-400"
              />

              <input
                id="login-email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="login-senha"
                className="block text-xs font-semibold text-gray-600"
              >
                Senha
              </label>

              <Link
                to="/esqueci-senha"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-500">
              <Lock
                size={16}
                className="text-gray-400"
              />

              <input
                id="login-senha"
                type={mostrarSenha ? "text" : "password"}
                required
                autoComplete="current-password"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="********"
                className="w-full text-sm outline-none"
              />

              <button
                type="button"
                onClick={() => setMostrarSenha((valor) => !valor)}
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={mostrarSenha}
                className="shrink-0 rounded text-gray-500 hover:text-gray-700"
              >
                {mostrarSenha ? (
                  <EyeOff size={16} aria-hidden="true" />
                ) : (
                  <Eye size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {erro && (
            <div
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600"
            >
              <p>{erro}</p>

              {precisaConfirmarEmail && !reenviado && (
                <button
                  type="button"
                  onClick={handleReenviar}
                  disabled={reenviando || !email}
                  className="mt-1 font-semibold underline disabled:opacity-60"
                >
                  {reenviando ? "Reenviando..." : "Reenviar e-mail de confirmação"}
                </button>
              )}

              {reenviado && <p className="mt-1">Se o e-mail existir, reenviamos o link de confirmação.</p>}
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="mt-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {enviando ? "Entrando..." : "Entrar"}
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="h-px flex-1 bg-gray-200" />
            ou entre com
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocial("google")}
              disabled={socialEnviando !== null}
              className="rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              Google
            </button>

            <button
              type="button"
              onClick={() => handleSocial("facebook")}
              disabled={socialEnviando !== null}
              className="rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              Facebook
            </button>
          </div>

          <p className="text-center text-xs text-gray-500">
            Ainda não tem conta?{" "}
            <Link
              to="/registrar"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Criar conta
            </Link>
          </p>

          <p className="text-center text-xs text-gray-500">
            <Link to="/termos" className="hover:text-gray-600">
              Termos de Serviço
            </Link>
            {" · "}
            <Link to="/privacidade" className="hover:text-gray-600">
              Privacidade
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
