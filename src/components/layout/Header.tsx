import { useState } from "react";
  import {
    Bell,
    CircleDollarSign,
    Menu,
    Search,
    CircleUserRound,
  } from "lucide-react";
  import { DespesasModal } from "./DespesasModal";
  import { useLocation } from "react-router-dom";
  import { useAuth } from "../../hooks/useAuth";
  import { iniciais } from "../../utils/iniciais";
  import { ehConta, perfilDe } from "../../utils/perfil";

  const TITULOS: Record<string, { titulo: string; subtitulo: string }> = {
    "/": { titulo: "Dashboard", subtitulo: "Visão geral do seu sistema automotivo." },
    "/clientes": { titulo: "Clientes", subtitulo: "Cadastro e acompanhamento dos clientes." },
    "/veiculos": { titulo: "Veículos", subtitulo: "Veículos, valor FIPE e impostos." },
    "/ordens-servico": { titulo: "Ordens de serviço", subtitulo: "Serviços dos veículos da oficina." },
    "/manutencoes": { titulo: "Manutenções", subtitulo: "Histórico e próximas manutenções." },
    "/configuracoes": { titulo: "Configurações", subtitulo: "Preferências do sistema." },
    "/admin": { titulo: "Administração", subtitulo: "Visão geral da plataforma." },
  };

  // Pessoa (Cuidados com seu carro) e frota usam outras telas nas mesmas rotas.
  const TITULOS_CONTA: Record<string, { titulo: string; subtitulo: string }> = {
    "/": { titulo: "Início", subtitulo: "Seu carro e o que vence em breve." },
    "/veiculos": { titulo: "Veículos", subtitulo: "Valor, IPVA e licenciamento estimados." },
    "/configuracoes": { titulo: "Configurações", subtitulo: "Preferências do sistema." },
    "/admin": { titulo: "Administração", subtitulo: "Visão geral da plataforma." },
  };

  interface HeaderProps {
    aoAbrirMenu: () => void;
  }

  export function Header({ aoAbrirMenu }: HeaderProps) {
    const { usuario } = useAuth();
    const { pathname } = useLocation();
    const [despesasAbertas, setDespesasAbertas] = useState(false);
    const titulos = ehConta(perfilDe(usuario)) ? TITULOS_CONTA : TITULOS;
    const { titulo, subtitulo } = titulos[pathname] ?? titulos["/"];

    return (
      <header className="print:hidden flex h-[82px] items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={aoAbrirMenu}
            title="Abrir menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 md:hidden"
          >
            <Menu size={19} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-bold text-gray-900">
              {titulo}
            </h1>

            <p className="mt-0.5 hidden text-xs text-gray-500 sm:block">
              {subtitulo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {ehConta(perfilDe(usuario)) && (
            <button
              type="button"
              onClick={() => setDespesasAbertas(true)}
              title="Despesas"
              aria-label="Despesas"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-blue-600"
            >
              <CircleDollarSign size={19} />
            </button>
          )}

          <button className="hidden h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 sm:flex">
            <Search size={19} />
          </button>
  
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50">
            <Bell size={19} />
  
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
  
          <div className="ml-1 flex items-center gap-2 text-gray-500">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
              {iniciais(usuario?.name)}
            </div>
  
            <CircleUserRound size={18} />
          </div>
        </div>
        {despesasAbertas && (
          <DespesasModal onClose={() => setDespesasAbertas(false)} />
        )}
      </header>
    );
  }