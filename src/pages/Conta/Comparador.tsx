import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Info, Search, Tag, Truck } from "lucide-react";
import { contaService, fichaTecnicaContaService } from "../../services/conta";
import { comparadorService } from "../../services/comparador";
import { mensagemErro } from "../../services/api";
import { formatarMoeda } from "../../utils/formatters";
import {
  PECAS_COMPARADOR,
  linksOutrasLojas,
  montarConsulta,
  normalizarMedidaPneu,
  type ChavePeca,
} from "../../utils/comparador";
import type { ResultadoComparador } from "../../types/comparador";
import type { VeiculoConta } from "../../types/conta";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

export function Comparador() {
  const [veiculos, setVeiculos] = useState<VeiculoConta[] | null>(null);
  const [veiculoId, setVeiculoId] = useState("");
  const [peca, setPeca] = useState<ChavePeca | "livre">("pneu");
  const [textoLivre, setTextoLivre] = useState("");
  const [medida, setMedida] = useState("");
  const [medidaDaFicha, setMedidaDaFicha] = useState(false);
  const [resultado, setResultado] = useState<ResultadoComparador | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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
      });

    return () => {
      ativo = false;
    };
  }, []);

  // A medida do pneu vem da ficha técnica do veículo, se já foi preenchida.
  useEffect(() => {
    if (!veiculoId) return;

    let ativo = true;

    fichaTecnicaContaService
      .buscar(Number(veiculoId))
      .then((ficha) => {
        if (!ativo) return;
        const salva = normalizarMedidaPneu(
          String(ficha.manutencao?.pneu_medida ?? ""),
        );
        setMedida(salva);
        setMedidaDaFicha(Boolean(salva));
      })
      .catch(() => {
        if (!ativo) return;
        setMedida("");
        setMedidaDaFicha(false);
      });

    return () => {
      ativo = false;
    };
  }, [veiculoId]);

  const veiculo = (veiculos ?? []).find((v) => String(v.id) === veiculoId) ?? null;
  const textoDaPeca =
    peca === "livre"
      ? textoLivre
      : (PECAS_COMPARADOR.find((p) => p.chave === peca)?.texto ?? "");

  const medidaNormalizada = normalizarMedidaPneu(medida);
  const precisaMedida = peca === "pneu";
  const consulta = montarConsulta({
    texto: textoDaPeca,
    veiculo,
    medidaPneu: precisaMedida ? medidaNormalizada : undefined,
  });

  async function comparar(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (precisaMedida && !medidaNormalizada) {
      setErro("Informe a medida do pneu, por exemplo 185/65 R15.");
      return;
    }

    if (peca === "livre" && textoLivre.trim().length < 3) {
      setErro("Digite o que você quer comparar.");
      return;
    }

    try {
      setBuscando(true);
      setResultado(await comparadorService.comparar(consulta));
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setBuscando(false);
    }
  }

  const maisBarato = resultado?.maisBarato ?? null;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h2 className="font-display text-[28px] leading-none font-bold tracking-wide text-gray-900 uppercase">Comparador de preços</h2>
        <p className="mt-1 text-xs text-gray-500">
          Buscamos o produto agora e mostramos as 3 ofertas mais baratas, com o
          lugar que está vendendo menos.
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

      <form
        onSubmit={(e) => void comparar(e)}
        className="mb-5 space-y-4 rounded-2xl border border-gray-200 bg-white p-5"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-[11px] text-gray-500">
            Veículo
            <select
              value={veiculoId}
              onChange={(e) => {
                setVeiculoId(e.target.value);
                setResultado(null);
              }}
              className={`mt-1 ${classeCampo}`}
            >
              {(veiculos ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.apelido?.trim() || `${v.marca} ${v.modelo}`} · {v.placa}
                </option>
              ))}
              <option value="">Sem veículo</option>
            </select>
          </label>

          <label className="block text-[11px] text-gray-500">
            O que comparar
            <select
              value={peca}
              onChange={(e) => {
                setPeca(e.target.value as ChavePeca | "livre");
                setResultado(null);
              }}
              className={`mt-1 ${classeCampo}`}
            >
              {PECAS_COMPARADOR.map((p) => (
                <option key={p.chave} value={p.chave}>
                  {p.rotulo}
                </option>
              ))}
              <option value="livre">Outra peça (digitar)</option>
            </select>
          </label>
        </div>

        {peca === "livre" && (
          <label className="block text-[11px] text-gray-500">
            Peça
            <input
              type="text"
              value={textoLivre}
              maxLength={80}
              placeholder="Ex.: coifa da homocinética"
              onChange={(e) => setTextoLivre(e.target.value)}
              className={`mt-1 ${classeCampo}`}
            />
          </label>
        )}

        {precisaMedida && (
          <div>
            <label className="block text-[11px] text-gray-500">
              Medida do pneu
              <input
                type="text"
                value={medida}
                maxLength={20}
                placeholder="Ex.: 185/65 R15"
                onChange={(e) => {
                  setMedida(e.target.value);
                  setMedidaDaFicha(false);
                }}
                className={`mt-1 ${classeCampo}`}
              />
            </label>
            <p className="mt-1 text-[11px] text-gray-400">
              {medidaDaFicha ? (
                <>Medida tirada da ficha técnica do seu veículo.</>
              ) : (
                <>
                  Está na lateral do pneu ou no manual. Salve em{" "}
                  <Link
                    to="/ficha-tecnica"
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Ficha técnica
                  </Link>{" "}
                  para não digitar de novo.
                </>
              )}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-gray-400">
            Busca: <strong className="text-gray-600">{consulta || "—"}</strong>
          </p>
          <button
            type="submit"
            disabled={buscando || !consulta}
            className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            <Search size={16} />
            {buscando ? "Buscando..." : "Comparar preços"}
          </button>
        </div>
      </form>

      {resultado?.status === "sem_configuracao" && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs text-amber-800">
          O comparador automático ainda não foi ativado pela equipe do MyCar.
          Enquanto isso, use os atalhos das lojas abaixo.
        </div>
      )}
      {resultado?.status === "indisponivel" && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs text-amber-800">
          A loja não respondeu agora. Tente de novo em instantes ou use os
          atalhos abaixo.
        </div>
      )}
      {resultado?.status === "sem_resultados" && (
        <div className="mb-5 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-xs text-gray-600">
          Nenhuma oferta encontrada para “{resultado.consulta}”. Tente outra
          descrição ou use os atalhos das lojas.
        </div>
      )}

      {resultado?.status === "ok" && maisBarato && (
        <div className="mb-5 space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              <Tag size={14} />
              Mais barato agora
            </p>
            <p className="font-display mt-2 text-[44px] leading-none font-bold text-emerald-800">
              {formatarMoeda(maisBarato.preco)}
            </p>
            <p className="mt-1 text-xs text-emerald-800">
              em <strong>{maisBarato.loja}</strong> ({resultado.fonte})
              {maisBarato.economiaVsMediana > 0 &&
                ` · ${formatarMoeda(maisBarato.economiaVsMediana)} abaixo do preço mediano`}
            </p>
            <a
              href={maisBarato.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Ver anúncio <ExternalLink size={13} />
            </a>
          </div>

          <ul className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {resultado.itens.map((item, indice) => (
              <li
                key={item.url}
                className="flex items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-0"
              >
                {item.imagem ? (
                  <img
                    src={item.imagem}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg border border-gray-100 object-contain"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-100" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                    {indice + 1}º menor preço
                  </p>
                  <p className="truncate text-xs font-semibold text-gray-900">
                    {item.titulo}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                    {item.loja}
                    {item.freteGratis && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Truck size={12} /> frete grátis
                      </span>
                    )}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="font-display text-2xl leading-none font-semibold text-gray-900">
                    {formatarMoeda(item.preco)}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Abrir
                  </a>
                </div>
              </li>
            ))}
          </ul>

          <p className="flex items-start gap-2 text-[11px] text-gray-400">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              Preços do {resultado.fonte} no momento da busca, entre{" "}
              {resultado.totalEncontrado} anúncios novos. Frete e prazo não
              entram. Confira no anúncio se é a unidade ou o jogo e se serve no
              seu carro antes de comprar.
            </span>
          </p>
        </div>
      )}

      {resultado && (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-semibold text-gray-900">Comparar em outras lojas</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {linksOutrasLojas(resultado.consulta).map((l) => (
              <a
                key={l.loja}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
              >
                {l.loja} <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
