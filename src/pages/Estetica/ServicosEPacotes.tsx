import { useState, type FormEvent } from "react";
import { Package, Plus, Trash2 } from "lucide-react";
import { catalogoEsteticaService } from "../../services/estetica";
import { mensagemErro } from "../../services/api";
import { useCarregarLista } from "../../hooks/useCarregarLista";
import { useConfirmar } from "../../hooks/useNotificacoes";
import type { PacoteDaEstetica, ServicoDaEstetica } from "../../types/estetica";
import { Alert } from "../../components/ui/Alert";
import { Campo, CampoDeTexto, classeDoRotulo } from "../../components/ui/Campo";

/** Catálogo da estética: serviços (os longos têm dias previstos) e pacotes com preço próprio. */
export function ServicosEPacotes() {
  const pedirConfirmacao = useConfirmar();
  const [servicos, setServicos] = useState<ServicoDaEstetica[] | null>(null);
  const [pacotes, setPacotes] = useState<PacoteDaEstetica[] | null>(null);
  // Erro de uma ação (remover pacote) fica separado do erro da carga do catálogo.
  const [erroDeAcao, setErroDeAcao] = useState<string | null>(null);
  const { carregando, erro: erroDeCarga, recarregar: carregar } = useCarregarLista("catalogo", async (ativo) => {
    const [s, p] = await Promise.all([catalogoEsteticaService.servicos(), catalogoEsteticaService.pacotes()]);
    if (!ativo()) return;
    setServicos(s);
    setPacotes(p);
  });

  async function removerPacote(p: PacoteDaEstetica) {
    if (!(await pedirConfirmacao({ mensagem: `Remover o pacote ${p.nome}?`, confirmarTexto: "Remover", perigo: true }))) return;

    setErroDeAcao(null);
    try {
      await catalogoEsteticaService.removerPacote(p.id);
      carregar();
    } catch (error) {
      setErroDeAcao(mensagemErro(error));
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 p-4 sm:p-8 lg:grid-cols-2">
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Serviços</h2>
        <NovoServico onSalvo={carregar} />
        {servicos && servicos.length === 0 && <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">Nenhum serviço cadastrado.</p>}
        {servicos && servicos.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {servicos.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.nome}</p>
                  <p className="text-xs text-gray-500">
                    R$ {s.preco.toFixed(2).replace(".", ",")}
                    {s.longo ? ` · serviço longo, ${s.dias_previstos} dias` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Pacotes</h2>
        {servicos && servicos.length > 0 && <NovoPacote servicos={servicos} onSalvo={carregar} />}
        {erroDeAcao && <Alert tone="danger">{erroDeAcao}</Alert>}

        {erroDeCarga && (
          <Alert tone="danger" action={{ label: "Tentar de novo", onClick: carregar }}>
            {erroDeCarga}
          </Alert>
        )}

        {carregando && !erroDeCarga && <p className="text-xs text-gray-500">Carregando...</p>}
        {pacotes && pacotes.length === 0 && <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">Nenhum pacote cadastrado.</p>}
        {pacotes && pacotes.length > 0 && (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {pacotes.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    <Package size={14} className="mr-1 inline text-gray-500" />
                    {p.nome} · R$ {p.preco.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-xs text-gray-500">{p.servicos.map((s) => s.nome).join(", ")}</p>
                </div>
                <button type="button" onClick={() => void removerPacote(p)} aria-label={`Remover o pacote ${p.nome}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NovoServico({ onSalvo }: { onSalvo: () => void }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [dias, setDias] = useState("0");
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    try {
      await catalogoEsteticaService.criarServico({ nome, preco: Number(preco.replace(",", ".")), dias_previstos: Number(dias) });
      setNome("");
      setPreco("");
      setDias("0");
      onSalvo();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <form onSubmit={(e) => void salvar(e)} className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
      <Campo id="srv-nome" rotulo="Nome">
        {(a) => <CampoDeTexto {...a} maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Lavagem completa" />}
      </Campo>
      <Campo id="srv-preco" rotulo="Preço (R$)">
        {(a) => <CampoDeTexto {...a} inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} />}
      </Campo>
      <Campo id="srv-dias" rotulo="Dias (0 = rápido)">
        {(a) => <CampoDeTexto {...a} type="number" min={0} max={365} value={dias} onChange={(e) => setDias(e.target.value)} />}
      </Campo>
      <button type="submit" className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
        <Plus size={14} /> Adicionar
      </button>
      {erro && <Alert tone="danger" className="sm:col-span-4">{erro}</Alert>}
    </form>
  );
}

function NovoPacote({ servicos, onSalvo }: { servicos: ServicoDaEstetica[]; onSalvo: () => void }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [escolhidos, setEscolhidos] = useState<number[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    try {
      await catalogoEsteticaService.criarPacote({ nome, preco: Number(preco.replace(",", ".")), servicos: escolhidos });
      setNome("");
      setPreco("");
      setEscolhidos([]);
      onSalvo();
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <form onSubmit={(e) => void salvar(e)} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <Campo id="pac-nome" rotulo="Nome do pacote">
          {(a) => <CampoDeTexto {...a} maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} />}
        </Campo>
        <Campo id="pac-preco" rotulo="Preço do pacote (R$)">
          {(a) => <CampoDeTexto {...a} inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} />}
        </Campo>
      </div>
      <fieldset className="space-y-1">
        <legend className={classeDoRotulo}>Serviços incluídos</legend>
        {servicos.map((s) => (
          <label key={s.id} className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={escolhidos.includes(s.id)}
              onChange={() => setEscolhidos((atual) => (atual.includes(s.id) ? atual.filter((x) => x !== s.id) : [...atual, s.id]))}
            />
            {s.nome}
          </label>
        ))}
      </fieldset>
      {erro && <Alert tone="danger">{erro}</Alert>}
      <button type="submit" className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">Criar pacote</button>
    </form>
  );
}
