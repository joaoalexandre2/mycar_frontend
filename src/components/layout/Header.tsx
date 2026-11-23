import { useEffect, useState } from "react";
  import { CircleDollarSign, Menu } from "lucide-react";
  import { DespesasModal } from "./DespesasModal";
  import { BuscaGlobal } from "./BuscaGlobal";
  import { Atualizacoes } from "./Atualizacoes";
  import { useLocation } from "react-router-dom";
  import { useAuth } from "../../hooks/useAuth";
  import { AvatarMenu } from "./AvatarMenu";
  import { ehConta, perfilDe } from "../../utils/perfil";
  import type { Perfil } from "../../types/auth";
  import { TITULO_DA_PAGINA } from "../ui/escalaDeTitulos";

  const TITULOS: Record<string, { titulo: string; subtitulo: string }> = {
    "/": { titulo: "Dashboard", subtitulo: "Visão geral do seu sistema automotivo." },
    "/clientes": { titulo: "Clientes", subtitulo: "Cadastro e acompanhamento dos clientes." },
    "/veiculos": { titulo: "Veículos", subtitulo: "Veículos, valor FIPE e impostos." },
    "/ordens-servico": { titulo: "Ordens de serviço", subtitulo: "Serviços dos veículos da oficina." },
    "/manutencoes": { titulo: "Manutenções", subtitulo: "Histórico e próximas manutenções." },
    "/sugestoes": { titulo: "Sugestões", subtitulo: "Ajude a melhorar o MyCar." },
    "/configuracoes": { titulo: "Configurações", subtitulo: "Preferências do sistema." },
    "/admin": { titulo: "Administração", subtitulo: "Visão geral da plataforma." },
  };

  // Pessoa (Cuidados com seu carro) e frota usam outras telas nas mesmas rotas.
  // O título é o mesmo nome do item no menu lateral (Sidebar): uma tela, um nome.
  // Quando o nome do menu é curto, o nome completo aparece no subtítulo.
  const TITULOS_CONTA: Record<string, { titulo: string; subtitulo: string }> = {
    "/": { titulo: "Início", subtitulo: "Seu carro e o que vence em breve." },
    "/veiculos": { titulo: "Meus veículos", subtitulo: "Valor, IPVA e licenciamento estimados." },
    "/agenda": { titulo: "Agenda", subtitulo: "Agenda de veículos: quem vai usar cada veículo e quando." },
    "/frota/ocorrencias": { titulo: "Ocorrências", subtitulo: "Acidentes, avarias e problemas, com as fotos antes e depois do reparo." },
    "/frota/cadastros": { titulo: "Motoristas e centros", subtitulo: "Motoristas e centros de custo: quem dirige a frota e a que área cada gasto pertence." },
    "/frota/configuracoes": { titulo: "Gestão da frota", subtitulo: "Motivos de troca, grupos de usuários, papéis e histórico de acessos." },
    "/frota/painel": { titulo: "Painel da frota", subtitulo: "Alertas, checklists e uso dos veículos." },
    "/frota/multas": { titulo: "Multas", subtitulo: "Quem estava com o veículo em cada infração." },
    "/frota/financeiro": { titulo: "Financeiro", subtitulo: "Quanto cada veículo, motorista e centro de custo gastou." },
    "/frota/relatorios": { titulo: "Relatórios", subtitulo: "Utilização, custos, multas e vencimentos, com exportação para o Excel." },
    "/frota/checklists": { titulo: "Checklists", subtitulo: "Os itens que o motorista confere na saída e na devolução." },
    "/estetica": { titulo: "Pátio", subtitulo: "Do check-in à entrega, com as fotos de cada carro." },
    "/estetica/placas": { titulo: "Histórico por placa", subtitulo: "Serviços, valores e retorno previsto de cada carro." },
    "/estetica/servicos": { titulo: "Serviços e pacotes", subtitulo: "O catálogo que aparece no pátio." },
    "/estetica/financeiro": { titulo: "Financeiro", subtitulo: "Quanto ainda falta receber, e de que forma." },
    "/servicos": { titulo: "Serviços", subtitulo: "Troca de óleo, bateria e avisos da próxima vez." },
    "/pecas": { titulo: "Peças", subtitulo: "Catálogo de peças do seu carro." },
    "/ficha-tecnica": { titulo: "Ficha técnica", subtitulo: "Dados do seu carro e manutenção." },
    "/comparador": { titulo: "Comparador", subtitulo: "Os menores preços para a peça que você procura." },
    "/sugestoes": { titulo: "Sugestões", subtitulo: "Ajude a melhorar o MyCar." },
    "/configuracoes": { titulo: "Configurações", subtitulo: "Preferências do sistema." },
    "/admin": { titulo: "Administração", subtitulo: "Visão geral da plataforma." },
  };

  // Na frota o menu chama a tela de veículos de "Veículos da frota".
  const TITULOS_FROTA: Record<string, { titulo: string; subtitulo: string }> = {
    ...TITULOS_CONTA,
    "/veiculos": { titulo: "Veículos da frota", subtitulo: "Valor, IPVA e licenciamento estimados." },
  };

  // A página do QR Code (/qr/:token) não está no menu; sem isto o cabeçalho dizia "Início".
  const TITULO_DO_QR = { titulo: "QR Code do veículo", subtitulo: "As reservas de hoje e o checklist deste veículo." };

  function tituloDaRota(perfil: Perfil, pathname: string) {
    if (!ehConta(perfil)) return TITULOS[pathname] ?? TITULOS["/"];
    if (perfil !== "frota") return TITULOS_CONTA[pathname] ?? TITULOS_CONTA["/"];
    if (pathname.startsWith("/qr/")) return TITULO_DO_QR;

    return TITULOS_FROTA[pathname] ?? TITULOS_FROTA["/"];
  }

  interface HeaderProps {
    aoAbrirMenu: () => void;
    /** Para o botão do menu dizer se ele está aberto (leitor de tela). */
    menuAberto?: boolean;
  }

  export function Header({ aoAbrirMenu, menuAberto = false }: HeaderProps) {
    const { usuario } = useAuth();
    const { pathname } = useLocation();
    const [despesasAbertas, setDespesasAbertas] = useState(false);
    const { titulo, subtitulo } = tituloDaRota(perfilDe(usuario), pathname);

    // O título da aba/janela acompanha a tela (leitor de tela e histórico do
    // navegador mostravam "MyCar" em todas).
    useEffect(() => {
      document.title = `${titulo} · MyCar`;
    }, [titulo]);

    return (
      <header className="print:hidden flex h-[82px] items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 md:px-8">
        {/* A esquerda encolhe (min-w-0) para o título truncar; sem isso o
            título longo empurrava os botões da direita para fora da tela. */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={aoAbrirMenu}
            title="Abrir menu"
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            aria-controls="menu-lateral"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 md:hidden"
          >
            <Menu size={19} />
          </button>

          <div className="min-w-0">
            <h1 className={`truncate ${TITULO_DA_PAGINA}`}>
              {titulo}
            </h1>

            <p className="mt-0.5 hidden truncate text-xs text-gray-500 sm:block">
              {subtitulo}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
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

          <BuscaGlobal />

          <Atualizacoes />
  
          <div className="ml-1 flex items-center gap-2 text-gray-500">
            <AvatarMenu />
          </div>
        </div>
        {despesasAbertas && (
          <DespesasModal onClose={() => setDespesasAbertas(false)} />
        )}
      </header>
    );
  }