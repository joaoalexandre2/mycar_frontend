import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Camera, Plus } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { FotosModal } from "../../components/estetica/FotosModal";
import { catalogoEsteticaService, patioService } from "../../services/estetica";
import { mensagemErro } from "../../services/api";
import { formatarDataHora } from "../../utils/formatters";
import type { AtendimentoDaEstetica, EtapaDoAtendimento, FormaDePagamento, PacoteDaEstetica, ServicoDaEstetica } from "../../types/estetica";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

const COLUNAS: { etapa: EtapaDoAtendimento; titulo: string }[] = [
  { etapa: "entrada", titulo: "Entrada" },
  { etapa: "atendimento", titulo: "Em atendimento" },
  { etapa: "entrega", titulo: "Pronto para entrega" },
  { etapa: "entregue", titulo: "Entregues" },
];

const FORMAS: { valor: FormaDePagamento; texto: string }[] = [
  { valor: "pix", texto: "Pix" },
  { valor: "cartao", texto: "Cartão" },
  { valor: "dinheiro", texto: "Dinheiro" },
  { valor: "boleto", texto: "Boleto" },
];

/** Pátio em etapas: cada carro do check-in à entrega, com fotos e cobrança. */
export function Patio() {
  const [atendimentos, setAtendimentos] = useState<AtendimentoDaEstetica[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);
  const [novo, setNovo] = useState(false);
  const [fotosDe, setFotosDe] = useState<AtendimentoDaEstetica | null>(null);
  const carregar = () => setVersao((v) => v + 1);

  useEffect(() => {
    let ativo = true;

    patioService
      .listar()
      .then((lista) => {
        if (!ativo) return;
        setAtendimentos(lista);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  async function avancar(a: AtendimentoDaEstetica) {
    setErro(null);

    try {
      await patioService.avancar(a.id);
      carregar();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function receber(a: AtendimentoDaEstetica, forma: FormaDePagamento) {
    setErro(null);

    try {
      await patioService.atualizar(a.id, { forma_pagamento: forma, pago: true });
      carregar();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pátio</h2>
          <p className="mt-1 text-sm text-gray-500">Do check-in à entrega, com as fotos de cada carro.</p>
        </div>
        <button type="button" onClick={() => setNovo(true)} className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={15} /> Novo carro
        </button>
      </div>

      {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUNAS.map((coluna) => {
          const cartoes = (atendimentos ?? []).filter((a) => a.etapa === coluna.etapa);

          return (
            <section key={coluna.etapa} aria-label={coluna.titulo} className="space-y-3 rounded-xl bg-gray-50 p-3">
              <h3 className="flex items-center justify-between text-xs font-semibold tracking-wide text-gray-500 uppercase">
                {coluna.titulo} <span className="rounded-full bg-white px-2 py-0.5 text-gray-700">{cartoes.length}</span>
              </h3>

              {cartoes.length === 0 && <p className="px-1 py-4 text-center text-xs text-gray-400">Nenhum carro aqui.</p>}

              {cartoes.map((a) => (
                <article key={a.id} className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{a.placa}</p>
                      <p className="text-xs text-gray-500">{[a.modelo, a.cliente_nome].filter(Boolean).join(" · ") || "Sem cliente informado"}</p>
                    </div>
                    {!a.pago && a.dias_em_aberto !== null && a.etapa === "entregue" && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{a.dias_em_aberto} d em aberto</span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600">
                    {a.servicos.map((s) => s.nome).join(", ")} · R$ {a.total_servicos.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-xs text-gray-500">
                    Chegou {a.entrada_em ? formatarDataHora(a.entrada_em) : "—"}
                    {a.previsao_entrega ? ` · previsão ${formatarDataHora(a.previsao_entrega)}` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    Fotos: {a.fotos_checkin} de chegada · {a.fotos_checkout} de saída
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" onClick={() => setFotosDe(a)} className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                      <Camera size={13} /> Fotos
                    </button>
                    {a.etapa_seguinte && (
                      <button type="button" onClick={() => void avancar(a)} className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 text-xs font-semibold text-white hover:bg-blue-700">
                        {etiquetaDaProxima(a.etapa_seguinte)} <ArrowRight size={13} />
                      </button>
                    )}
                  </div>

                  {a.etapa === "entregue" && !a.pago && (
                    <div className="space-y-1 border-t border-gray-100 pt-2">
                      <p className="text-xs font-semibold text-gray-700">Receber</p>
                      <div className="flex flex-wrap gap-1.5">
                        {FORMAS.map((f) => (
                          <button key={f.valor} type="button" onClick={() => void receber(a, f.valor)} className="h-7 rounded-md border border-gray-200 px-2 text-xs text-gray-700 hover:bg-gray-50">
                            {f.texto}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </section>
          );
        })}
      </div>

      {novo && (
        <NovoCarro
          onSalvo={() => {
            setNovo(false);
            carregar();
          }}
          onClose={() => setNovo(false)}
        />
      )}

      {fotosDe && <FotosModal atendimento={fotosDe} onAtualizado={carregar} onClose={() => setFotosDe(null)} />}
    </div>
  );
}

function etiquetaDaProxima(etapa: EtapaDoAtendimento): string {
  return { atendimento: "Iniciar atendimento", entrega: "Pronto para entrega", entregue: "Entregar" }[etapa as "atendimento" | "entrega" | "entregue"] ?? etapa;
}

function NovoCarro({ onSalvo, onClose }: { onSalvo: () => void; onClose: () => void }) {
  const [servicos, setServicos] = useState<ServicoDaEstetica[]>([]);
  const [pacotes, setPacotes] = useState<PacoteDaEstetica[]>([]);
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [cliente, setCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [escolhidos, setEscolhidos] = useState<number[]>([]);
  const [pacoteId, setPacoteId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    catalogoEsteticaService.servicos().then((lista) => setServicos(lista.filter((s) => s.ativo))).catch(() => setServicos([]));
    catalogoEsteticaService.pacotes().then(setPacotes).catch(() => setPacotes([]));
  }, []);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!placa.trim()) {
      setErro("Informe a placa do carro.");
      return;
    }

    if (!pacoteId && escolhidos.length === 0) {
      setErro("Escolha pelo menos um serviço ou um pacote.");
      return;
    }

    try {
      setSalvando(true);
      await patioService.criar({
        placa,
        modelo: modelo || null,
        cliente_nome: cliente || null,
        cliente_telefone: telefone || null,
        servicos: pacoteId ? [] : escolhidos,
        pacote_id: pacoteId ? Number(pacoteId) : null,
      });
      onSalvo();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Novo carro no pátio" icone={<Plus size={16} />} onClose={onClose} larguraMax="max-w-lg">
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="pat-placa" className={rotulo}>Placa</label>
            <input id="pat-placa" type="text" maxLength={10} value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="ABC1D23" className={classeCampo} />
          </div>
          <div>
            <label htmlFor="pat-modelo" className={rotulo}>Modelo (opcional)</label>
            <input id="pat-modelo" type="text" maxLength={120} value={modelo} onChange={(e) => setModelo(e.target.value)} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="pat-cliente" className={rotulo}>Cliente (opcional)</label>
            <input id="pat-cliente" type="text" maxLength={120} value={cliente} onChange={(e) => setCliente(e.target.value)} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="pat-telefone" className={rotulo}>WhatsApp (opcional)</label>
            <input id="pat-telefone" type="text" maxLength={30} value={telefone} onChange={(e) => setTelefone(e.target.value)} className={classeCampo} />
          </div>
        </div>

        <div>
          <label htmlFor="pat-pacote" className={rotulo}>Pacote (opcional)</label>
          <select id="pat-pacote" value={pacoteId} onChange={(e) => setPacoteId(e.target.value)} className={classeCampo}>
            <option value="">Nenhum: escolher serviços abaixo</option>
            {pacotes.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} · R$ {p.preco.toFixed(2).replace(".", ",")}</option>
            ))}
          </select>
        </div>

        {!pacoteId && (
          <fieldset className="space-y-2">
            <legend className={rotulo}>Serviços</legend>
            {servicos.length === 0 && <p className="text-xs text-gray-500">Cadastre os serviços em Serviços e pacotes.</p>}
            {servicos.map((s) => (
              <label key={s.id} className="flex items-center justify-between gap-2 text-xs text-gray-700">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={escolhidos.includes(s.id)}
                    onChange={() => setEscolhidos((atual) => (atual.includes(s.id) ? atual.filter((x) => x !== s.id) : [...atual, s.id]))}
                  />
                  {s.nome}
                  {s.longo && <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-800">{s.dias_previstos} d</span>}
                </span>
                <span>R$ {s.preco.toFixed(2).replace(".", ",")}</span>
              </label>
            ))}
          </fieldset>
        )}

        {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {salvando ? "Salvando..." : "Entrar no pátio"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
