import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const EMAIL_CONTATO = "joaoalekirst@gmail.com";

interface PaginaLegalProps {
  titulo: string;
  atualizadoEm: string;
  children: ReactNode;
}

/** Moldura das páginas públicas de texto (privacidade e termos). */
export function PaginaLegal({ titulo, atualizadoEm, children }: PaginaLegalProps) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <article className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
        <p className="mt-1 text-xs text-gray-500">Atualizado em {atualizadoEm}</p>

        <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-gray-700">
          {children}
        </div>
      </article>
    </div>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-gray-900">{titulo}</h2>
      {children}
    </section>
  );
}
