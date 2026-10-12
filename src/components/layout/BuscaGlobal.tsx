import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Car, Search, Users } from "lucide-react";
import { Modal } from "../ui/Modal";
import { clientesService } from "../../services/clientes";
import { veiculosService } from "../../services/veiculos";
import { contaService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { ehConta, perfilDe } from "../../utils/perfil";
import { formatarCpf, formatarMoeda } from "../../utils/formatters";

interface Resultado {
  chave: string;
  titulo: string;
  detalhe: string;
  destino: string;
  tipo: "cliente" | "veiculo";
}

const MINIMO_DE_LETRAS = 2;
const POR_GRUPO = 5;

async function buscarNaOficina(termo: string): Promise<Resultado[]> {
  const [clientes, veiculos] = await Promise.all([
    clientesService.listarPaginado({ busca: termo, porPagina: POR_GRUPO }),
    veiculosService.listarPaginado({ busca: termo, porPagina: POR_GRUPO }),
  ]);

  return [
    ...clientes.dados.map((cliente) => ({
      chave: `cliente-${cliente.id}`,
      titulo: cliente.nome,
      detalhe: `${formatarCpf(cliente.cpf)} · ${cliente.telefone}`,
      destino: "/clientes",
      tipo: "cliente" as const,
    })),
    ...veiculos.dados.map((veiculo) => ({
      chave: `veiculo-${veiculo.id}`,
      titulo: `${veiculo.marca} ${veiculo.modelo}`,
      detalhe: [veiculo.placa, veiculo.cliente?.nome].filter(Boolean).join(" · "),
      destino: "/veiculos",
      tipo: "veiculo" as const,
    })),
  ];
}

async function buscarNaConta(termo: string): Promise<Resultado[]> {
  const pagina = await contaService.listarVeiculos({ busca: termo, porPagina: POR_GRUPO });

  return pagina.dados.map((veiculo) => ({
    chave: `veiculo-${veiculo.id}`,
    titulo: veiculo.apelido?.trim() || `${veiculo.marca} ${veiculo.modelo}`,
    detalhe: [
      veiculo.placa,
      veiculo.fipeValor !== null ? `FIPE ${formatarMoeda(veiculo.fipeValor)}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    destino: "/veiculos",
    tipo: "veiculo" as const,
  }));
}

/**
 * O botão de lupa do cabeçalho: busca rápida de clientes e veículos (ou, na
 * conta pessoal e na frota, dos veículos), sem sair da tela em que se está.
 */
export function BuscaGlobal() {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        aria-label="Buscar"
        title="Buscar"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50"
      >
        <Search
          size={19}
          aria-hidden="true"
        />
      </button>

      {aberta && <PainelDeBusca aoFechar={() => setAberta(false)} />}
    </>
  );
}

function PainelDeBusca({ aoFechar }: { aoFechar: () => void }) {
  const { usuario } = useAuth();
  const conta = ehConta(perfilDe(usuario));

  const [texto, setTexto] = useState("");
  const [termo, setTermo] = useState("");
  const [busca, setBusca] = useState<{
    termo: string;
    resultados: Resultado[];
    erro: string | null;
  } | null>(null);

  // Espera a pessoa parar de digitar.
  useEffect(() => {
    const timer = setTimeout(() => setTermo(texto.trim()), 300);

    return () => clearTimeout(timer);
  }, [texto]);

  useEffect(() => {
    if (termo.length < MINIMO_DE_LETRAS) return;

    let ativo = true;

    (conta ? buscarNaConta(termo) : buscarNaOficina(termo))
      .then((resultados) => {
        if (ativo) setBusca({ termo, resultados, erro: null });
      })
      .catch((error) => {
        if (ativo) setBusca({ termo, resultados: [], erro: mensagemErro(error) });
      });

    return () => {
      ativo = false;
    };
  }, [termo, conta]);

  const curto = termo.length < MINIMO_DE_LETRAS;
  const buscando = !curto && busca?.termo !== termo;
  const atual = !curto && busca?.termo === termo ? busca : null;

  return (
    <Modal
      titulo="Buscar"
      subtitulo={
        conta
          ? "Procure um veículo pela placa, apelido, marca ou modelo."
          : "Procure um cliente (nome, CPF, telefone) ou um veículo (placa, marca, modelo)."
      }
      larguraMax="max-w-lg"
      fecharAoClicarFora
      onClose={aoFechar}
    >
      <div className="px-6 py-5">
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            autoFocus
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            aria-label="O que você procura?"
            placeholder="Digite pelo menos 2 letras..."
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div
          className="mt-4"
          aria-live="polite"
        >
          {curto ? (
            <p className="text-xs text-gray-400">
              Comece a digitar para ver os resultados.
            </p>
          ) : buscando ? (
            <p className="text-xs text-gray-400">Buscando...</p>
          ) : atual?.erro ? (
            <p
              role="alert"
              className="text-xs text-red-600"
            >
              {atual.erro}
            </p>
          ) : atual && atual.resultados.length === 0 ? (
            <p className="text-xs text-gray-500">
              Nada encontrado para “{termo}”.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {atual?.resultados.map((item) => (
                <li key={item.chave}>
                  <Link
                    to={item.destino}
                    onClick={aoFechar}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      {item.tipo === "cliente" ? (
                        <Users
                          size={15}
                          aria-hidden="true"
                        />
                      ) : (
                        <Car
                          size={15}
                          aria-hidden="true"
                        />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-gray-900">
                        {item.titulo}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-gray-500">
                        {item.detalhe}
                      </span>
                    </span>

                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {item.tipo === "cliente" ? "Cliente" : "Veículo"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
