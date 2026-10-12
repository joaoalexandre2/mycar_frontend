import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CircleAlert, CircleCheck, Clock3 } from "lucide-react";
import { contaService } from "../../services/conta";
import { manutencoesService } from "../../services/manutencoes";
import { mensagemErro } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { ehConta, perfilDe } from "../../utils/perfil";
import { formatarData, formatarKm } from "../../utils/formatters";

type Tom = "atrasado" | "breve";

interface Aviso {
  chave: string;
  titulo: string;
  detalhe: string;
  prazo: string;
  tom: Tom;
}

const ROTULO_TIPO: Record<string, string> = {
  ipva: "IPVA",
  licenciamento: "Licenciamento",
  revisao: "Revisão",
  seguro: "Fim do seguro",
  documento: "Documento",
  servico: "Serviço",
};

/** Quantos avisos a lista mostra (o resto está na tela do assunto). */
const LIMITE = 8;

function prazoEmDias(dias: number) {
  if (dias < 0) return `${Math.abs(dias)} d de atraso`;
  if (dias === 0) return "hoje";
  return `em ${dias} d`;
}

/** Avisos da conta pessoa/frota: o que vence em breve (o mesmo da tela inicial). */
async function avisosDaConta(): Promise<Aviso[]> {
  const resumo = await contaService.resumo();

  return resumo.vencimentos.slice(0, LIMITE).map((item) => {
    const porKm = Boolean(item.porKm);
    const faltam = item.kmRestante ?? 0;

    return {
      chave: `${item.tipo}-${item.rotulo ?? ""}-${item.veiculoId}-${item.data}`,
      titulo: item.rotulo ?? ROTULO_TIPO[item.tipo] ?? item.tipo,
      detalhe: `${item.veiculo} · ${item.placa}`,
      prazo: porKm
        ? faltam <= 0
          ? "já passou"
          : `faltam ${formatarKm(faltam)}`
        : prazoEmDias(item.dias),
      tom: porKm ? (faltam <= 0 ? "atrasado" : "breve") : item.dias < 0 ? "atrasado" : "breve",
    } satisfies Aviso;
  });
}

/** Avisos da oficina: manutenções atrasadas e as que estão chegando. */
async function avisosDaOficina(): Promise<Aviso[]> {
  const [atrasadas, proximas] = await Promise.all([
    manutencoesService.listarPaginado({ status: "atrasada", porPagina: LIMITE }),
    manutencoesService.listarPaginado({ status: "proxima", porPagina: LIMITE }),
  ]);

  const paraAviso = (
    manutencao: (typeof atrasadas.dados)[number],
    tom: Tom,
  ): Aviso => ({
    chave: `manutencao-${manutencao.id}`,
    titulo: `${tom === "atrasado" ? "Atrasada" : "Próxima"}: ${manutencao.tipo}`,
    detalhe: manutencao.veiculo
      ? `${manutencao.veiculo.marca} ${manutencao.veiculo.modelo} · ${manutencao.veiculo.placa}`
      : "Veículo",
    prazo: manutencao.proximaData ? formatarData(manutencao.proximaData) : "sem data",
    tom,
  });

  return [
    ...atrasadas.dados.map((m) => paraAviso(m, "atrasado")),
    ...proximas.dados.map((m) => paraAviso(m, "breve")),
  ].slice(0, LIMITE);
}

/**
 * O sininho do cabeçalho: lista o que precisa de atenção (vencimentos da
 * conta, ou manutenções da oficina) e só mostra o ponto vermelho quando há
 * algo de fato.
 */
export function Atualizacoes() {
  const { usuario } = useAuth();
  const conta = ehConta(perfilDe(usuario));

  const [aberto, setAberto] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const raiz = useRef<HTMLDivElement>(null);

  // Ao abrir a tela, para o ponto vermelho já refletir a realidade.
  useEffect(() => {
    let ativo = true;

    (conta ? avisosDaConta() : avisosDaOficina())
      .then((lista) => {
        if (!ativo) return;
        setAvisos(lista);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [conta]);

  // Abrir o painel recarrega, para não mostrar o que ficou velho.
  async function recarregar() {
    try {
      setAvisos(conta ? await avisosDaConta() : await avisosDaOficina());
      setErro(null);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  // Fecha com Esc e ao clicar fora.
  useEffect(() => {
    if (!aberto) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    function aoClicarFora(evento: MouseEvent) {
      if (raiz.current && !raiz.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicarFora);

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, [aberto]);

  function alternar() {
    const vaiAbrir = !aberto;
    setAberto(vaiAbrir);

    if (vaiAbrir) void recarregar();
  }

  const quantidade = avisos?.length ?? 0;
  const destino = conta ? "/" : "/manutencoes";

  return (
    <div
      ref={raiz}
      className="relative"
    >
      <button
        type="button"
        onClick={alternar}
        aria-label={
          quantidade > 0 ? `Atualizações: ${quantidade} aviso(s)` : "Atualizações"
        }
        aria-expanded={aberto}
        aria-haspopup="true"
        title="Atualizações"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
      >
        <Bell
          size={19}
          aria-hidden="true"
        />

        {quantidade > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500"
          />
        )}
      </button>

      {aberto && (
        <div
          role="region"
          aria-label="Atualizações"
          className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Atualizações</p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              {conta
                ? "O que vence em breve nos seus veículos."
                : "Manutenções atrasadas e as que estão chegando."}
            </p>
          </div>

          {erro ? (
            <p
              role="alert"
              className="px-4 py-4 text-xs text-red-600"
            >
              {erro}
            </p>
          ) : avisos === null ? (
            <p className="px-4 py-4 text-xs text-gray-400">Carregando...</p>
          ) : avisos.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-5 text-xs text-gray-500">
              <CircleCheck
                size={16}
                className="text-emerald-500"
                aria-hidden="true"
              />
              Tudo em dia. Nada precisa de atenção agora.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
              {avisos.map((aviso) => (
                <li
                  key={aviso.chave}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span
                    className={`mt-0.5 shrink-0 ${
                      aviso.tom === "atrasado" ? "text-red-500" : "text-blue-500"
                    }`}
                  >
                    {aviso.tom === "atrasado" ? (
                      <CircleAlert
                        size={16}
                        aria-hidden="true"
                      />
                    ) : (
                      <Clock3
                        size={16}
                        aria-hidden="true"
                      />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-gray-900">
                      {aviso.titulo}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">
                      {aviso.detalhe}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 text-[11px] font-semibold ${
                      aviso.tom === "atrasado" ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {aviso.prazo}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link
            to={destino}
            onClick={() => setAberto(false)}
            className="block border-t border-gray-100 px-4 py-3 text-center text-xs font-semibold text-blue-600 hover:bg-gray-50"
          >
            {conta ? "Ver tudo no início" : "Ver manutenções"}
          </Link>
        </div>
      )}
    </div>
  );
}
