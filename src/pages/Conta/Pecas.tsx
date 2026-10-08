import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Info, Package, Search, Trash2 } from "lucide-react";
import {
  catalogoPecasService,
  codigoPecaService,
  contaService,
} from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { formatarKm } from "../../utils/formatters";
import { linksDeBusca } from "../../utils/pecas";
import type {
  CatalogoDePecas,
  CodigoPeca,
  PecaCatalogo,
  VeiculoConta,
} from "../../types/conta";

const SUGESTOES = ["amortecedor", "coifa", "pastilha", "bateria", "correia", "óleo"];

function agruparPorSistema(pecas: PecaCatalogo[]) {
  const grupos = new Map<string, { rotulo: string; itens: PecaCatalogo[] }>();

  for (const peca of pecas) {
    const grupo = grupos.get(peca.sistema) ?? {
      rotulo: peca.sistemaRotulo,
      itens: [],
    };
    grupo.itens.push(peca);
    grupos.set(peca.sistema, grupo);
  }

  return [...grupos.entries()];
}

const classeCampo =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

function PecaItem({
  peca,
  veiculo,
  modeloCatalogo,
  aoMudarCodigos,
}: {
  peca: PecaCatalogo;
  veiculo: VeiculoConta | null;
  modeloCatalogo?: string;
  aoMudarCodigos: (pecaId: string, codigos: CodigoPeca[]) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [marca, setMarca] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const links = veiculo ? linksDeBusca(peca, veiculo, modeloCatalogo) : null;

  async function salvar(event: FormEvent) {
    event.preventDefault();
    if (!veiculo) return;
    setErro(null);

    if (!codigo.trim()) {
      setErro("Informe o código da peça.");
      return;
    }

    try {
      setSalvando(true);
      const novo = await codigoPecaService.registrar(veiculo.id, {
        peca_id: peca.id,
        marca: marca.trim() || null,
        codigo: codigo.trim(),
      });
      aoMudarCodigos(peca.id, [...peca.meusCodigos, novo]);
      setMarca("");
      setCodigo("");
      setAberto(false);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(item: CodigoPeca) {
    if (!veiculo || !window.confirm(`Remover o código ${item.codigo}?`)) return;

    try {
      await codigoPecaService.remover(veiculo.id, item.id);
      aoMudarCodigos(
        peca.id,
        peca.meusCodigos.filter((c) => c.id !== item.id),
      );
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold text-gray-900">{peca.nome}</p>
        {peca.posicao && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase text-gray-500">
            {peca.posicao}
          </span>
        )}
      </div>

      {peca.intervaloKm !== null && (
        <p className="mt-1 text-[11px] text-gray-500">
          Troca típica a cada {formatarKm(peca.intervaloKm)}
        </p>
      )}
      {peca.observacao && (
        <p className="mt-0.5 text-[11px] text-gray-400">{peca.observacao}</p>
      )}

      {peca.marcas.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-gray-400">Marcas comuns:</span>
          {peca.marcas.map((m) => (
            <span
              key={m}
              className="rounded-full border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-600"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {peca.meusCodigos.length > 0 && (
        <ul className="mt-2 space-y-1">
          {peca.meusCodigos.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800"
            >
              <span>
                <strong>Meu código:</strong> {item.codigo}
                {item.marca && ` · ${item.marca}`}
              </span>
              <button
                type="button"
                onClick={() => void remover(item)}
                title="Remover"
                className="text-emerald-700 hover:text-red-600"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {links && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
          >
            Achar o código <ExternalLink size={11} />
          </a>
          <a
            href={links.mercadoLivre}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            Ver no Mercado Livre <ExternalLink size={11} />
          </a>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="text-gray-500 hover:text-gray-700"
          >
            {aberto ? "Cancelar" : "Anotar meu código"}
          </button>
        </div>
      )}

      {aberto && (
        <form onSubmit={(e) => void salvar(e)} className="mt-2 space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="text"
              value={marca}
              maxLength={60}
              placeholder="Marca (ex.: Cofap)"
              onChange={(e) => setMarca(e.target.value)}
              className={classeCampo}
            />
            <input
              type="text"
              value={codigo}
              maxLength={60}
              placeholder="Código confirmado"
              onChange={(e) => setCodigo(e.target.value)}
              className={classeCampo}
            />
          </div>
          {erro && (
            <p role="alert" className="text-[11px] text-red-600">
              {erro}
            </p>
          )}
          <button
            type="submit"
            disabled={salvando}
            className="h-8 rounded-lg bg-blue-600 px-3 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar código"}
          </button>
        </form>
      )}

      {!aberto && erro && (
        <p role="alert" className="mt-1 text-[11px] text-red-600">
          {erro}
        </p>
      )}
    </li>
  );
}

export function Pecas() {
  const [veiculos, setVeiculos] = useState<VeiculoConta[] | null>(null);
  const [veiculoId, setVeiculoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [sistema, setSistema] = useState("");
  const [dados, setDados] = useState<CatalogoDePecas | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Os veículos da conta: o primeiro vira o padrão, para já abrir com as peças dele.
  useEffect(() => {
    let ativo = true;

    contaService
      .listarVeiculos({ porPagina: 100 })
      .then((pagina) => {
        if (!ativo) return;
        setVeiculos(pagina.dados);
        setVeiculoId(pagina.dados[0] ? String(pagina.dados[0].id) : "");
      })
      .catch((error) => {
        if (!ativo) return;
        setErro(mensagemErro(error));
        setVeiculos([]);
        setVeiculoId("");
      });

    return () => {
      ativo = false;
    };
  }, []);

  // Espera a pessoa parar de digitar antes de buscar.
  useEffect(() => {
    const timer = setTimeout(() => setBuscaAplicada(busca.trim()), 300);

    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    if (veiculoId === null) return;

    let ativo = true;

    catalogoPecasService
      .buscar({
        q: buscaAplicada,
        veiculoId: veiculoId ? Number(veiculoId) : undefined,
        sistema,
      })
      .then((resposta) => {
        if (!ativo) return;
        setErro(null);
        setDados(resposta);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [veiculoId, buscaAplicada, sistema]);

  const grupos = useMemo(() => agruparPorSistema(dados?.pecas ?? []), [dados]);

  const veiculoAtual =
    (veiculos ?? []).find((v) => String(v.id) === veiculoId) ?? null;

  function atualizarCodigos(pecaId: string, codigos: CodigoPeca[]) {
    setDados((atual) =>
      atual
        ? {
            ...atual,
            pecas: atual.pecas.map((p) =>
              p.id === pecaId ? { ...p, meusCodigos: codigos } : p,
            ),
          }
        : atual,
    );
  }

  function trocarVeiculo(valor: string) {
    setVeiculoId(valor);
    setSistema("");
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h2 className="font-display text-[28px] leading-none font-bold tracking-wide text-gray-900 uppercase">Peças</h2>
        <p className="mt-1 text-xs text-gray-500">
          Catálogo das peças do seu carro. Digite o que procura, como coifa ou
          amortecedor, ou navegue por sistema.
        </p>
      </div>

      {erro && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {erro}
        </p>
      )}

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={busca}
              maxLength={80}
              placeholder="Ex.: coifa, amortecedor, pastilha de freio..."
              onChange={(e) => setBusca(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white"
            />
          </div>

          <select
            value={veiculoId ?? ""}
            onChange={(e) => trocarVeiculo(e.target.value)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500 sm:w-72"
          >
            {(veiculos ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.apelido?.trim() || `${v.marca} ${v.modelo}`} · {v.placa}
              </option>
            ))}
            <option value="">Catálogo geral (sem veículo)</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-400">Tente:</span>
          {SUGESTOES.map((termo) => (
            <button
              key={termo}
              type="button"
              onClick={() => setBusca(termo)}
              className="rounded-full border border-gray-200 px-3 py-1 text-[11px] text-gray-600 transition hover:bg-gray-50"
            >
              {termo}
            </button>
          ))}
        </div>

        {dados && (
          <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-[11px] text-blue-700">
            {dados.escopo === "modelo" && dados.modelo && (
              <p>
                Peças do <strong>{dados.modelo.nome}</strong> (
                {dados.modelo.categoriaRotulo.toLowerCase()}), o modelo do seu
                veículo.
                {dados.modelo.original &&
                  ` Marca da peça original da montadora: ${dados.modelo.original}.`}
              </p>
            )}
            {dados.escopo === "geral" && (
              <p>
                O modelo de <strong>{dados.veiculo?.nome}</strong> ainda não está
                no catálogo ({dados.modelosNoCatalogo} modelos dos mais vendidos
                nos últimos anos). Mostrando as peças comuns a qualquer carro.
              </p>
            )}
            {dados.escopo === "catalogo" && (
              <p>
                Catálogo geral, de todos os tipos de carro. Escolha um veículo
                acima para ver só as peças do modelo dele.
              </p>
            )}
          </div>
        )}
      </div>

      {dados && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSistema("")}
            className={`h-8 rounded-full border px-3 text-[11px] font-semibold transition ${
              sistema === ""
                ? "border-blue-500 bg-blue-50 text-blue-600"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Todos
          </button>
          {dados.sistemas
            .filter((s) => s.total > 0)
            .map((s) => (
              <button
                key={s.chave}
                type="button"
                onClick={() => setSistema(s.chave)}
                className={`h-8 rounded-full border px-3 text-[11px] font-semibold transition ${
                  sistema === s.chave
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {s.rotulo} <span className="font-normal text-gray-400">{s.total}</span>
              </button>
            ))}
        </div>
      )}

      {!dados ? (
        !erro && <p className="text-xs text-gray-400">Carregando...</p>
      ) : veiculos?.length === 0 && dados.escopo === "catalogo" && !buscaAplicada ? (
        <p className="mb-4 text-[11px] text-gray-500">
          Você ainda não cadastrou veículo.{" "}
          <Link to="/veiculos" className="font-semibold text-blue-600 hover:text-blue-700">
            Cadastrar veículo
          </Link>{" "}
          para ver as peças do seu modelo.
        </p>
      ) : null}

      {dados && dados.total === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-xs text-gray-500">
            Nenhuma peça encontrada para “{buscaAplicada}”.
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            Tente outra palavra (por exemplo: amortecedor, coifa, pastilha, vela,
            bateria).
          </p>
        </div>
      )}

      <div className="space-y-4">
        {grupos.map(([chave, grupo]) => (
          <div
            key={chave}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
              <h3 className="font-display flex items-center gap-2 text-lg leading-none font-bold tracking-wide text-gray-900 uppercase">
                <Package size={15} className="text-blue-600" />
                {grupo.rotulo}
              </h3>
              <span className="text-[10px] text-gray-400">
                {grupo.itens.length} peça(s)
              </span>
            </div>

            <ul className="divide-y divide-gray-100">
              {grupo.itens.map((peca) => (
                <PecaItem
                  key={peca.id}
                  peca={peca}
                  veiculo={veiculoAtual}
                  modeloCatalogo={dados?.modelo?.nome}
                  aoMudarCodigos={atualizarCodigos}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {dados && (
        <p className="mt-5 flex items-start gap-2 text-[11px] text-gray-400">
          <Info size={14} className="mt-0.5 shrink-0" />
          {dados.aviso} As marcas são fabricantes comuns desse tipo de peça, não
          garantia de que servem no seu carro: use “Achar o código” e confirme
          pelo chassi, depois anote o código confirmado. Os intervalos de troca são típicos e variam por modelo e
          uso: vale o manual do veículo.
        </p>
      )}
    </div>
  );
}
