import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Car,
  Lock,
  Mail,
  Truck,
  User,
  Wrench,
} from "lucide-react";
import { authService } from "../../services/auth";
import { mensagemErro } from "../../services/api";
import type { Perfil } from "../../types/auth";
import { ehPerfil, ORDEM_PERFIS, PERFIS } from "../../utils/perfil";

const ICONES: Record<Perfil, React.ReactNode> = {
  pessoa: <Car size={20} />,
  oficina: <Wrench size={20} />,
  frota: <Truck size={20} />,
};

const CHAMADA: Record<Perfil, string> = {
  pessoa: "Cuide do seu carro",
  oficina: "Cadastre sua oficina",
  frota: "Cadastre sua frota",
};

export function Register() {
  const [parametros] = useSearchParams();
  const perfilDoLink = parametros.get("perfil");

  // Um link como /registrar?perfil=oficina já cai direto no formulário.
  const [perfil, setPerfil] = useState<Perfil | null>(
    ehPerfil(perfilDoLink) ? perfilDoLink : null,
  );
  const [nomeConta, setNomeConta] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cadastrado, setCadastrado] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (!perfil) {
      return;
    }

    if (senha !== confirmacao) {
      setErro("A confirmação de senha não é igual à senha.");
      return;
    }

    setEnviando(true);

    try {
      await authService.registrar({
        perfil,
        ...(perfil === "oficina" ? { nome_oficina: nomeConta } : {}),
        ...(perfil === "frota" ? { nome_frota: nomeConta } : {}),
        name: nome,
        email,
        password: senha,
        password_confirmation: confirmacao,
      });

      setCadastrado(true);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  if (cadastrado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Mail size={22} />
          </div>

          <h1 className="text-lg font-bold text-gray-900">
            Confirme seu e-mail
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Enviamos um link de confirmação para <strong>{email}</strong>.
            Clique nele para ativar sua conta e poder entrar.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  // Passo 1: o que a pessoa vai fazer no MyCar.
  if (!perfil) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Car size={22} />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">
                Criar conta no MyCar
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Como você vai usar o MyCar?
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {ORDEM_PERFIS.map((chave) => (
              <button
                key={chave}
                type="button"
                onClick={() => setPerfil(chave)}
                className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-blue-500 hover:bg-blue-50"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  {ICONES[chave]}
                </span>

                <span>
                  <span className="block text-sm font-semibold text-gray-900">
                    {PERFIS[chave].produto}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                    {PERFIS[chave].descricao}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Passo 2: os dados da conta.
  const nomeDaContaRotulo =
    perfil === "oficina" ? "Nome da oficina" : "Nome da frota ou empresa";
  const nomeDaContaExemplo =
    perfil === "oficina" ? "Ex.: Oficina do João" : "Ex.: Transportes Silva";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setPerfil(null);
            setErro(null);
          }}
          className="mb-4 flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={14} />
          Trocar tipo de conta
        </button>

        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
            {ICONES[perfil]}
          </div>

          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">
              {PERFIS[perfil].produto}
            </h1>

            <p className="mt-1 text-sm text-gray-500">{CHAMADA[perfil]}</p>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {perfil !== "pessoa" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                {nomeDaContaRotulo}
              </label>

              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-500">
                <Building2 size={16} className="text-gray-400" />

                <input
                  type="text"
                  required
                  autoFocus
                  value={nomeConta}
                  onChange={(event) => setNomeConta(event.target.value)}
                  placeholder={nomeDaContaExemplo}
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Seu nome
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-500">
              <User size={16} className="text-gray-400" />

              <input
                type="text"
                required
                autoFocus={perfil === "pessoa"}
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Seu nome completo"
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              E-mail
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-500">
              <Mail size={16} className="text-gray-400" />

              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@exemplo.com"
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Senha
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-500">
              <Lock size={16} className="text-gray-400" />

              <input
                type="password"
                required
                minLength={8}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Mínimo de 8 caracteres"
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">
              Confirmar senha
            </label>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-blue-500">
              <Lock size={16} className="text-gray-400" />

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
            {enviando ? "Criando conta..." : "Criar conta"}
          </button>

          <p className="text-center text-xs text-gray-500">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
