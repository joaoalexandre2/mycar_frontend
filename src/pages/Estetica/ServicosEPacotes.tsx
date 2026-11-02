import { useEffect, useState, type FormEvent } from "react";
import { Package, Plus, Trash2 } from "lucide-react";
import { catalogoEsteticaService } from "../../services/estetica";
import { mensagemErro } from "../../services/api";
import { useConfirmar } from "../../hooks/useNotificacoes";
import type { PacoteDaEstetica, ServicoDaEstetica } from "../../types/estetica";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

/** Catálogo da estética: serviços (os longos têm dias previstos) e pacotes com preço próprio. */
export function ServicosEPacotes() {
  const pedirConfirmacao = useConfirmar();
  const [servicos, setServicos] = useState<ServicoDaEstetica[] | null>(null);
  const [pacotes, setPacotes] = useState<PacoteDaEstetica[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [versao, setVersao] = useState(0);
  const carregar = () => setVersao((v) => v + 1);

  useEffect(() => {
    let ativo = true;

    Promise.all([catalogoEsteticaService.servicos(), catalogoEsteticaService.pacotes()])
      .then(([s, p]) => {
        if (!ativo) return;
        setServicos(s);
        setPacotes(p);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  async function removerPacote(p: PacoteDaEstetica) {
    if (!(await pedirConfirmacao({ mensagem: `Remover o pacote ${p.nome}?`, confirmarTexto: "Remover", perigo: true }))) return;

    try {
      await catalogoEsteticaService.removerPacote(p.id);
      carregar();
    } catch (error) {
      setErro(mensagemErro(error));
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
        {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>}
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
      <div>
        <label htmlFor="srv-nome" className={rotulo}>Nome</label>
        <input id="srv-nome" type="text" maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Lavagem completa" className={classeCampo} />
      </div>
      <div>
        <label htmlFor="srv-preco" className={rotulo}>Preço (R$)</label>
        <input id="srv-preco" type="text" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} className={classeCampo} />
      </div>
      <div>
        <label htmlFor="srv-dias" className={rotulo}>Dias (0 = rápido)</label>
        <input id="srv-dias" type="number" min={0} max={365} value={dias} onChange={(e) => setDias(e.target.value)} className={classeCampo} />
      </div>
      <button type="submit" className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700">
        <Plus size={14} /> Adicionar
      </button>
      {erro && <p role="alert" className="text-xs text-red-600 sm:col-span-4">{erro}</p>}
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
        <div>
          <label htmlFor="pac-nome" className={rotulo}>Nome do pacote</label>
          <input id="pac-nome" type="text" maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} className={classeCampo} />
        </div>
        <div>
          <label htmlFor="pac-preco" className={rotulo}>Preço do pacote (R$)</label>
          <input id="pac-preco" type="text" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} className={classeCampo} />
        </div>
      </div>
      <fieldset className="space-y-1">
        <legend className={rotulo}>Serviços incluídos</legend>
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
      {erro && <p role="alert" className="text-xs text-red-600">{erro}</p>}
      <button type="submit" className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">Criar pacote</button>
    </form>
  );
}
