import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImagePlus, Lightbulb, Send, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { sugestaoService } from "../../services/sugestoes";
import { mensagemErro } from "../../services/api";
import { formatarData } from "../../utils/formatters";
import { redimensionar } from "../../utils/imagem";
import type {
  CategoriaSugestao,
  StatusSugestao,
  Sugestao,
} from "../../types/sugestoes";

const LIMITE_IMAGENS = 3;

const classeCampo =
  "w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

const CATEGORIAS: { chave: CategoriaSugestao; rotulo: string }[] = [
  { chave: "melhoria", rotulo: "Melhoria de algo que já existe" },
  { chave: "nova_funcao", rotulo: "Nova funcionalidade" },
  { chave: "problema", rotulo: "Problema ou erro" },
  { chave: "outro", rotulo: "Outro" },
];

const STATUS: { chave: StatusSugestao; rotulo: string; classe: string }[] = [
  { chave: "nova", rotulo: "Recebida", classe: "bg-gray-100 text-gray-600" },
  { chave: "em_analise", rotulo: "Em análise", classe: "bg-amber-50 text-amber-700" },
  { chave: "planejada", rotulo: "Planejada", classe: "bg-blue-50 text-blue-700" },
  { chave: "feita", rotulo: "Feita", classe: "bg-emerald-50 text-emerald-700" },
  { chave: "recusada", rotulo: "Não vai entrar", classe: "bg-red-50 text-red-600" },
];

const rotuloCategoria = (chave: CategoriaSugestao) =>
  CATEGORIAS.find((c) => c.chave === chave)?.rotulo ?? chave;

function Selo({ status }: { status: StatusSugestao }) {
  const item = STATUS.find((s) => s.chave === status) ?? STATUS[0];

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.classe}`}>
      {item.rotulo}
    </span>
  );
}

/** Visão da equipe: muda o andamento e responde ao usuário. */
function RespostaDaEquipe({
  sugestao,
  aoSalvar,
}: {
  sugestao: Sugestao;
  aoSalvar: (atualizada: Sugestao) => void;
}) {
  const [status, setStatus] = useState<StatusSugestao>(sugestao.status);
  const [resposta, setResposta] = useState(sugestao.resposta ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    try {
      setSalvando(true);
      setErro(null);
      aoSalvar(await sugestaoService.responder(sugestao.id, status, resposta.trim() || null));
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg bg-gray-50 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusSugestao)}
          className={`h-8 ${classeCampo} sm:w-48`}
        >
          {STATUS.map((s) => (
            <option key={s.chave} value={s.chave}>
              {s.rotulo}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void salvar()}
          disabled={salvando}
          className="h-8 rounded-lg bg-blue-600 px-3 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </div>
      <textarea
        value={resposta}
        maxLength={1000}
        rows={2}
        placeholder="Resposta para quem enviou (opcional)"
        onChange={(e) => setResposta(e.target.value)}
        className={`${classeCampo} py-2`}
      />
      {erro && <p className="text-[11px] text-red-600">{erro}</p>}
    </div>
  );
}

export function Sugestoes() {
  const { usuario } = useAuth();
  const ehEquipe = Boolean(usuario?.admin);

  const [visao, setVisao] = useState<"minhas" | "todas">("minhas");
  const [filtro, setFiltro] = useState<StatusSugestao | "">("");
  const [lista, setLista] = useState<Sugestao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [categoria, setCategoria] = useState<CategoriaSugestao>("melhoria");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [imagens, setImagens] = useState<File[]>([]);
  const entradaImagem = useRef<HTMLInputElement>(null);

  // Prévias das imagens escolhidas (liberadas quando a lista muda).
  const previas = useMemo(() => imagens.map((f) => URL.createObjectURL(f)), [imagens]);
  useEffect(() => () => previas.forEach((url) => URL.revokeObjectURL(url)), [previas]);

  function escolherImagens(evento: ChangeEvent<HTMLInputElement>) {
    const novas = Array.from(evento.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    evento.target.value = "";

    if (novas.length === 0) return;

    setErro(null);
    setImagens((atuais) => [...atuais, ...novas].slice(0, LIMITE_IMAGENS));
  }

  useEffect(() => {
    let ativo = true;

    const carregar =
      visao === "todas"
        ? sugestaoService.todas(filtro || undefined)
        : sugestaoService.minhas();

    carregar
      .then((dados) => {
        if (!ativo) return;
        setErro(null);
        setLista(dados);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [visao, filtro]);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviada(false);

    if (titulo.trim().length < 4 || descricao.trim().length < 10) {
      setErro("Escreva um título (mín. 4 letras) e conte a ideia com pelo menos 10 letras.");
      return;
    }

    try {
      setEnviando(true);
      // Reduz cada imagem no navegador antes de subir (print de tela pesa muito).
      const reduzidas = await Promise.all(imagens.map((f) => redimensionar(f, 1280, 0.8)));

      const nova = await sugestaoService.enviar(
        {
          categoria,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
        },
        reduzidas,
      );
      setTitulo("");
      setDescricao("");
      setImagens([]);
      setEnviada(true);
      if (visao === "minhas") setLista((atual) => [nova, ...(atual ?? [])]);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  function atualizada(nova: Sugestao) {
    setLista((atual) => (atual ?? []).map((s) => (s.id === nova.id ? nova : s)));
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h2 className="font-display text-[28px] leading-none font-bold tracking-wide text-gray-900 uppercase">Sugestões</h2>
        <p className="mt-1 text-xs text-gray-500">
          Conte o que o MyCar pode melhorar. A equipe lê cada sugestão e você
          acompanha o andamento aqui.
        </p>
      </div>

      <form
        onSubmit={(e) => void enviar(e)}
        className="mb-6 space-y-3 rounded-2xl border border-gray-200 bg-white p-5"
      >
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Lightbulb size={16} className="text-blue-600" />
          Nova sugestão
        </p>

        <div>
          <p id="tipo-sugestao" className="text-[11px] text-gray-500">
            Tipo
          </p>
          {/* Botões em vez de <select>: o menu nativo do Chrome aparece fora do
              lugar em alguns computadores. */}
          <div
            role="radiogroup"
            aria-labelledby="tipo-sugestao"
            className="mt-1 flex flex-wrap gap-2"
          >
            {CATEGORIAS.map((c) => {
              const ativo = c.chave === categoria;

              return (
                <button
                  key={c.chave}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setCategoria(c.chave)}
                  className={`h-10 rounded-lg border px-4 text-xs font-semibold transition ${
                    ativo
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {c.rotulo}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block text-[11px] text-gray-500">
          Título
          <input
            type="text"
            value={titulo}
            maxLength={120}
            placeholder="Ex.: Aviso da troca de pneus"
            onChange={(e) => setTitulo(e.target.value)}
            className={`mt-1 h-10 ${classeCampo}`}
          />
        </label>

        <label className="block text-[11px] text-gray-500">
          Conte a ideia
          <textarea
            value={descricao}
            maxLength={2000}
            rows={4}
            placeholder="O que você gostaria de poder fazer e por quê?"
            onChange={(e) => setDescricao(e.target.value)}
            className={`mt-1 py-2 ${classeCampo}`}
          />
        </label>

        <div>
          <input
            ref={entradaImagem}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={escolherImagens}
          />

          <div className="flex flex-wrap items-center gap-3">
            {previas.map((url, indice) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt={`Imagem ${indice + 1} da sugestão`}
                  className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImagens((atuais) => atuais.filter((_, i) => i !== indice))}
                  title="Remover imagem"
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white hover:bg-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {imagens.length < LIMITE_IMAGENS && (
              <button
                type="button"
                onClick={() => entradaImagem.current?.click()}
                className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                <ImagePlus size={15} />
                Anexar imagem
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-gray-400">
            Opcional: até {LIMITE_IMAGENS} imagens, como um print da tela. Só você e a equipe veem.
          </p>
        </div>

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {erro}
          </p>
        )}
        {enviada && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Sugestão enviada. Obrigado! Você acompanha o andamento na lista abaixo.
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={enviando}
            className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            <Send size={15} />
            {enviando ? "Enviando..." : "Enviar sugestão"}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5">
          <h3 className="font-display text-xl leading-none font-bold tracking-wide text-gray-900 uppercase">
            {visao === "todas" ? "Todas as sugestões (equipe)" : "Minhas sugestões"}
          </h3>

          {ehEquipe && (
            <div className="flex flex-wrap items-center gap-2">
              {(["minhas", "todas"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setVisao(v);
                    setLista(null);
                  }}
                  className={`h-8 rounded-full border px-3 text-[11px] font-semibold transition ${
                    visao === v
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {v === "minhas" ? "Minhas" : "Todas"}
                </button>
              ))}

              {visao === "todas" && (
                <select
                  value={filtro}
                  onChange={(e) => {
                    setFiltro(e.target.value as StatusSugestao | "");
                    setLista(null);
                  }}
                  className={`h-8 ${classeCampo} sm:w-40`}
                >
                  <option value="">Todos os status</option>
                  {STATUS.map((s) => (
                    <option key={s.chave} value={s.chave}>
                      {s.rotulo}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {!lista ? (
          <p className="p-5 text-xs text-gray-400">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="p-5 text-xs text-gray-400">
            {visao === "todas"
              ? "Nenhuma sugestão por aqui."
              : "Você ainda não enviou nenhuma sugestão."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {lista.map((s) => (
              <li key={s.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{s.titulo}</p>
                    <p className="mt-0.5 text-[10px] text-gray-400">
                      {rotuloCategoria(s.categoria)} · {formatarData(s.criadaEm)}
                      {s.autor &&
                        ` · ${s.autor.nome ?? "—"} (${s.autor.perfil ?? "—"}, ${s.autor.email ?? "—"})`}
                    </p>
                  </div>
                  <Selo status={s.status} />
                </div>

                <p className="mt-2 whitespace-pre-line text-xs text-gray-600">{s.descricao}</p>

                {s.anexos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {s.anexos.map((anexo, indice) => (
                      <a
                        key={anexo.id}
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir imagem"
                      >
                        <img
                          src={anexo.url}
                          alt={`Imagem ${indice + 1} anexada`}
                          loading="lazy"
                          className="h-20 w-20 rounded-lg border border-gray-200 object-cover transition hover:opacity-80"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {s.resposta && visao === "minhas" && (
                  <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
                    <strong>Resposta da equipe:</strong> {s.resposta}
                  </p>
                )}

                {visao === "todas" && (
                  <RespostaDaEquipe sugestao={s} aoSalvar={atualizada} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
