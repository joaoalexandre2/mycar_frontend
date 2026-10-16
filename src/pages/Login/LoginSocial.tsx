import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth";
import { mensagemErro } from "../../services/api";

/** Volta do login com Google/Facebook: troca o código pela sessão. */
export function LoginSocial() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { atualizarUsuario } = useAuth();
  const codigo = params.get("codigo");
  const [erroTroca, setErroTroca] = useState<string | null>(null);
  const iniciou = useRef(false);

  const erro = params.get("erro") ?? (codigo ? erroTroca : "Login social inválido.");

  useEffect(() => {
    // O código vale uma única vez: evita a troca dupla do StrictMode.
    if (!codigo || iniciou.current) return;
    iniciou.current = true;

    authService
      .concluirLoginSocial(codigo)
      .then((usuario) => {
        atualizarUsuario(usuario);
        navigate("/", { replace: true });
      })
      .catch((e) => setErroTroca(mensagemErro(e)));
  }, [codigo, atualizarUsuario, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {erro ? (
          <>
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>
            <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-blue-600">
              Voltar ao login
            </Link>
          </>
        ) : (
          <p className="text-sm text-gray-500">Entrando...</p>
        )}
      </div>
    </div>
  );
}
