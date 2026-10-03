import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  pecasService,
  type FontePeca,
  type Peca,
} from "../../services/pecas";
import { mensagemErro } from "../../services/api";
import { formatarData } from "../../utils/formatters";

const FORM_VAZIO = {
  tipo: "",
  especificacao: "",
  marca: "",
  fonte: "servico" as FontePeca,
  usado_em: "",
  observacao: "",
};

export function PecasCard({ veiculoId }: { veiculoId: number }) {
  const [tipos, setTipos] = useState<Record<string, string>>({});
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    pecasService
      .listar(veiculoId)
      .then((resposta) => {
        if (!ativo) return;
        setTipos(resposta.tipos);
        setPecas(resposta.pecas);
      })
      .catch((error) => {
        if (ativo) window.alert(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [veiculoId]);

  async function registrar() {
    if (!form.tipo || !form.especificacao.trim()) {
      window.alert("Escolha o tipo e informe o código ou a especificação.");
      return;
    }

    try {
      setSalvando(true);
      const nova = await pecasService.registrar(veiculoId, {
        tipo: form.tipo,
        especificacao: form.especificacao.trim(),
        marca: form.marca.trim() || null,
        fonte: form.fonte,
        usado_em: form.usado_em || null,
        observacao: form.observacao.trim() || null,
      });
      setPecas((atuais) => [nova, ...atuais]);
      setForm(FORM_VAZIO);
      setAberto(false);
    } catch (error) {
      window.alert(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(peca: Peca) {
    if (!window.confirm(`Remover "${peca.especificacao}"?`)) return;

    try {
      await pecasService.remover(veiculoId, peca.id);
      setPecas((atuais) => atuais.filter((item) => item.id !== peca.id));
    } catch (error) {
      window.alert(mensagemErro(error));
    }
  }

  // A lista vem do mais recente para o mais antigo; a primeira de cada
  // tipo/fonte é a "atual".
  const atual = (tipo: string, fonte: FontePeca) =>
    pecas.find((peca) => peca.tipo === tipo && peca.fonte === fonte);

  const tiposComPeca = Object.keys(tipos).filter((tipo) =>
    pecas.some((peca) => peca.tipo === tipo),
  );

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Peças</h3>
          <p className="mt-1 text-[11px] text-gray-400">
            Anote a peça instalada em cada serviço e as referências do veículo.
            Dados informados por vocês: confirme com o manual ou o catálogo.
          </p>
        </div>
        {!aberto && (
          <button
            onClick={() => setAberto(true)}
            className="flex h-8 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 text-[11px] font-medium text-gray-600 hover:bg-gray-50 print:hidden"
          >
            <Plus size={13} />
            Registrar peça
          </button>
        )}
      </div>

      {aberto && (
        <div className="space-y-3 border-b border-gray-100 p-5 print:hidden">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-[11px] text-gray-500">
              Tipo
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              >
                <option value="">Selecione</option>
                {Object.entries(tipos).map(([chave, rotulo]) => (
                  <option key={chave} value={chave}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] text-gray-500">
              Código ou especificação
              <input
                value={form.especificacao}
                onChange={(e) => setForm({ ...form, especificacao: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              />
            </label>
            <label className="block text-[11px] text-gray-500">
              Marca (opcional)
              <input
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              />
            </label>
            <label className="block text-[11px] text-gray-500">
              Data da instalação (opcional)
              <input
                type="date"
                value={form.usado_em}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm({ ...form, usado_em: e.target.value })}
                className="mt-1 h-9 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.fonte === "servico"}
                onChange={() => setForm({ ...form, fonte: "servico" })}
              />
              Peça instalada em um serviço
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.fonte === "ficha"}
                onChange={() => setForm({ ...form, fonte: "ficha" })}
              />
              Referência (manual / catálogo)
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setAberto(false);
                setForm(FORM_VAZIO);
              }}
              className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => void registrar()}
              disabled={salvando}
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Registrar"}
            </button>
          </div>
        </div>
      )}

      {tiposComPeca.length === 0 ? (
        <p className="p-5 text-xs text-gray-400">
          Nenhuma peça registrada para este veículo ainda.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {tiposComPeca.map((tipo) => {
            const servico = atual(tipo, "servico");
            const ficha = atual(tipo, "ficha");

            return (
              <div key={tipo} className="px-5 py-3">
                <p className="text-xs font-semibold text-gray-800">{tipos[tipo]}</p>
                {servico && (
                  <p className="mt-1 text-[11px] text-gray-600">
                    Da última vez usamos:{" "}
                    <strong className="font-semibold text-gray-800">
                      {servico.especificacao}
                    </strong>
                    {servico.marca ? ` (${servico.marca})` : ""}
                    {servico.usado_em ? ` em ${formatarData(servico.usado_em)}` : ""}
                  </p>
                )}
                {ficha && (
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Referência: {ficha.especificacao}
                    {ficha.marca ? ` (${ficha.marca})` : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pecas.length > 0 && (
        <details className="border-t border-gray-100 px-5 py-3 print:hidden">
          <summary className="cursor-pointer text-[11px] font-medium text-gray-500">
            Todos os registros ({pecas.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {pecas.map((peca) => (
              <li
                key={peca.id}
                className="flex items-center justify-between gap-3 text-[11px] text-gray-600"
              >
                <span>
                  {tipos[peca.tipo] ?? peca.tipo}: {peca.especificacao}
                  {peca.marca ? ` (${peca.marca})` : ""} ·{" "}
                  {peca.fonte === "servico" ? "serviço" : "referência"}
                  {peca.usado_em ? ` · ${formatarData(peca.usado_em)}` : ""}
                </span>
                <button
                  onClick={() => void remover(peca)}
                  className="text-gray-400 hover:text-red-600"
                  title="Remover"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
