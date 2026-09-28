import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

export function EmailConfirmado() {
  const [params] = useSearchParams();
  const status = params.get("status");
  const confirmado = status === "ok";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-white ${
            confirmado ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {confirmado ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
        </div>

        <h1 className="text-lg font-bold text-gray-900">
          {confirmado ? "E-mail confirmado!" : "Link inválido ou expirado"}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {confirmado
            ? "Sua conta já está ativa. Você já pode entrar no MyCar."
            : "Esse link de confirmação não é mais válido. Solicite um novo e-mail de confirmação na tela de login."}
        </p>

        <Link
          to="/login"
          className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Ir para o login
        </Link>
      </div>
    </div>
  );
}
