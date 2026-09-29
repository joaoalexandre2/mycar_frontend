import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Car, Mail } from "lucide-react";
import { authService } from "../../services/auth";
import { mensagemErro } from "../../services/api";

export function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      await authService.esqueciSenha(email);
      setEnviado(true);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
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
            <h1 className="text-xl font-bold text-gray-900">Esqueceu sua senha?</h1>

            <p className="mt-1 text-sm text-gray-500">
              Informe seu e-mail para receber o link de redefinição.
            </p>
          </div>
        </div>

        {enviado ? (
          <div className="text-center">
            <p className="rounded-lg bg-green-50 px-3 py-3 text-sm text-green-700">
              Se o e-mail existir, enviamos um link para redefinir a senha. Confira sua caixa de
              entrada.
            </p>

            <Link
              to="/login"
              className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">E-mail</label>

              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-500">
                <Mail
                  size={16}
                  className="text-gray-400"
                />

                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@exemplo.com"
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>

            {erro && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar link de redefinição"}
            </button>

            <p className="text-center text-xs text-gray-500">
              Lembrou a senha?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
