import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Car, Lock } from "lucide-react";
import { authService } from "../../services/auth";
import { mensagemErro } from "../../services/api";

export function RedefinirSenha() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [redefinido, setRedefinido] = useState(false);

  const linkInvalido = !token || !email;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (senha !== confirmacao) {
      setErro("A confirmação de senha não é igual à senha.");
      return;
    }

    setEnviando(true);

    try {
      await authService.redefinirSenha({
        token,
        email,
        password: senha,
        password_confirmation: confirmacao,
      });
      setRedefinido(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
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
            <h1 className="text-xl font-bold text-gray-900">Redefinir senha</h1>

            <p className="mt-1 text-sm text-gray-500">Escolha uma nova senha para {email || "sua conta"}.</p>
          </div>
        </div>

        {linkInvalido ? (
          <div className="text-center">
            <p className="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-600">
              Este link está incompleto ou inválido. Solicite um novo.
            </p>

            <Link
              to="/esqueci-senha"
              className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Solicitar novo link
            </Link>
          </div>
        ) : redefinido ? (
          <p className="rounded-lg bg-green-50 px-3 py-3 text-center text-sm text-green-700">
            Senha redefinida! Levando você para o login...
          </p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Nova senha</label>

              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-500">
                <Lock
                  size={16}
                  className="text-gray-400"
                />

                <input
                  type="password"
                  required
                  minLength={8}
                  autoFocus
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Confirmar nova senha
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-500">
                <Lock
                  size={16}
                  className="text-gray-400"
                />

                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmacao}
                  onChange={(event) => setConfirmacao(event.target.value)}
                  placeholder="Repita a senha"
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>

            {erro && (
              <p className="whitespace-pre-line rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="mt-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {enviando ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
