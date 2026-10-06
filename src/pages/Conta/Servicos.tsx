import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Wrench, X } from "lucide-react";
import { contaService, servicoService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import {
  formatarData,
  formatarKm,
  formatarMoeda,
  hojeISO,
} from "../../utils/formatters";
import type {
  Servico,
  ServicosDaConta,
  SituacaoServico,
  VeiculoConta,
} from "../../types/conta";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

const SITUACAO: Record<SituacaoServico, { texto: string; classe: string }> = {
  em_dia: { texto: "Em dia", classe: "bg-emerald-50 text-emerald-700" },
  vence_em_breve: { texto: "Trocar em breve", classe: "bg-amber-50 text-amber-700" },
  vencido: { texto: "Vencido", classe: "bg-red-50 text-red-600" },
  sem_aviso: { texto: "Sem aviso", classe: "bg-gray-100 text-gray-500" },
  anterior: { texto: "Anterior", classe: "bg-gray-100 text-gray-400" },
};

/** Sugestões de aviso por tipo (o usuário pode trocar). */
const SUGESTAO: Record<string, { meses: string; km: string }> = {
  oleo: { meses: "6", km: "10000" },
  bateria: { meses: "24", km: "" },
  palhetas: { meses: "12", km: "" },
  filtros: { meses: "12", km: "10000" },
  pneus: { meses: "", km: "40000" },
  freios: { meses: "", km: "30000" },
  alinhamento: { meses: "6", km: "10000" },
  correia: { meses: "", km: "60000" },
};

const OPCOES_MESES = [
  { valor: "", texto: "Sem aviso por prazo" },
  { valor: "3", texto: "3 meses" },
  { valor: "6", texto: "6 meses" },
  { valor: "12", texto: "12 meses" },
  { valor: "24", texto: "24 meses" },
];

function textoProxima(item: Servico) {
  const partes: string[] = [];

  if (item.proximoEm) partes.push(formatarData(item.proximoEm));
  if (item.proximaKm !== null) partes.push(formatarKm(item.proximaKm));

  return partes.length > 0 ? partes.join(" ou ") : "—";
}

function textoRestante(item: Servico) {
  const partes: string[] = [];

  if (item.diasRestantes !== null) {
    partes.push(
      item.diasRestantes < 0
        ? `${Math.abs(item.diasRestantes)} dia(s) de atraso`
        : item.diasRestantes === 0
          ? "vence hoje"
          : `em ${item.diasRestantes} dia(s)`,
    );
  }

  if (item.kmRestante !== null) {
    partes.push(
      item.kmRestante <= 0
        ? `passou ${formatarKm(Math.abs(item.kmRestante))}`
        : `faltam ${formatarKm(item.kmRestante)}`,
    );
  }

  return partes.join(" · ");
}

export function Servicos() {
  const [dados, setDados] = useState<ServicosDaConta | null>(null);
  const [veiculos, setVeiculos] = useState<VeiculoConta[]>([]);
  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.all([
      servicoService.listar(),
      contaService.listarVeiculos({ porPagina: 100 }),
    ])
      .then(([servicos, pagina]) => {
        if (!ativo) return;
        setDados(servicos);
        setVeiculos(pagina.dados);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function remover(item: Servico) {
    if (!window.confirm(`Remover "${item.rotulo}" do histórico?`)) return;

    try {
      setDados(await servicoService.remover(item.id));
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  const lista = (dados?.servicos ?? []).filter(
    (s) => !filtroVeiculo || String(s.veiculoContaId) === filtroVeiculo,
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[21px] font-bold text-gray-900">Serviços</h2>
          <p className="mt-1 text-xs text-gray-500">
            Troca de óleo, bateria, palhetas e outros serviços, com aviso da
            próxima vez por prazo ou por quilometragem.
          </p>
        </div>

        <button
          onClick={() => setModalAberto(true)}
          disabled={veiculos.length === 0}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={18} />
          Novo serviço
        </button>
      </div>

      {erro && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {erro}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Histórico</h3>
            <p className="mt-1 text-[11px] text-gray-400">
              O aviso vale para o serviço mais recente de cada tipo. O km atual
              vem dos abastecimentos e serviços que você registrou.
            </p>
          </div>

          {veiculos.length > 1 && (
            <select
              value={filtroVeiculo}
              onChange={(e) => setFiltroVeiculo(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
            >
              <option value="">Todos os veículos</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.apelido?.trim() || `${v.marca} ${v.modelo}`} · {v.placa}
                </option>
              ))}
            </select>
          )}
        </div>

        {!dados ? (
          <p className="p-5 text-xs text-gray-400">Carregando...</p>
        ) : veiculos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-gray-500">
              Cadastre um veículo para registrar serviços.
            </p>
            <Link
              to="/veiculos"
              className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Cadastrar veículo
            </Link>
          </div>
        ) : lista.length === 0 ? (
          <p className="p-5 text-xs text-gray-400">
            Nenhum serviço registrado ainda. Clique em “Novo serviço” e informe,
            por exemplo, a última troca de óleo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tabela-cartoes">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Serviço", "Veículo", "Feito em", "Próxima troca", "Situação"].map(
                    (titulo) => (
                      <th
                        key={titulo}
                        className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {titulo}
                      </th>
                    ),
                  )}
                  <th className="w-12 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {lista.map((item) => {
                  const situacao = SITUACAO[item.situacao];

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 last:border-0 ${
                        item.vigente ? "" : "opacity-60"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Wrench size={17} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              {item.rotulo}
                            </p>
                            {item.valor !== null && (
                              <p className="mt-0.5 text-[10px] text-gray-400">
                                {formatarMoeda(item.valor)}
                              </p>
                            )}
                            {item.observacoes && (
                              <p className="mt-0.5 text-[10px] text-gray-400">
                                {item.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="Veículo" className="px-5 py-4 text-xs text-gray-600">
                        {item.veiculo}
                        <span className="block text-[10px] text-gray-400">
                          {item.placa}
                        </span>
                      </td>
                      <td data-label="Feito em" className="px-5 py-4 text-xs text-gray-600">
                        {formatarData(item.realizadoEm)}
                        {item.km !== null && (
                          <span className="block text-[10px] text-gray-400">
                            {formatarKm(item.km)}
                          </span>
                        )}
                      </td>
                      <td data-label="Próxima troca" className="px-5 py-4 text-xs text-gray-600">
                        {item.vigente ? textoProxima(item) : "—"}
                        {item.vigente && textoRestante(item) && (
                          <span className="block text-[10px] text-gray-400">
                            {textoRestante(item)}
                          </span>
                        )}
                      </td>
                      <td data-label="Situação" className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${situacao.classe}`}
                        >
                          {situacao.texto}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void remover(item)}
                          title="Remover"
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && dados && (
        <NovoServicoModal
          veiculos={veiculos}
          tipos={dados.tipos}
          onClose={() => setModalAberto(false)}
          onSalvo={(novo) => {
            setDados(novo);
            setModalAberto(false);
          }}
        />
      )}
    </div>
  );
}

function NovoServicoModal({
  veiculos,
  tipos,
  onClose,
  onSalvo,
}: {
  veiculos: VeiculoConta[];
  tipos: ServicosDaConta["tipos"];
  onClose: () => void;
  onSalvo: (dados: ServicosDaConta) => void;
}) {
  const [veiculoId, setVeiculoId] = useState(String(veiculos[0]?.id ?? ""));
  const [tipo, setTipo] = useState("oleo");
  const [titulo, setTitulo] = useState("");
  const [realizadoEm, setRealizadoEm] = useState(hojeISO());
  const [km, setKm] = useState("");
  const [valor, setValor] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [meses, setMeses] = useState(SUGESTAO.oleo.meses);
  const [intervaloKm, setIntervaloKm] = useState(SUGESTAO.oleo.km);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function escolherTipo(novo: string) {
    setTipo(novo);
    const sugestao = SUGESTAO[novo] ?? { meses: "", km: "" };
    setMeses(sugestao.meses);
    setIntervaloKm(sugestao.km);
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    const kmNumero = km ? Number(km.replace(/\D/g, "")) : null;
    const intervaloNumero = intervaloKm
      ? Number(intervaloKm.replace(/\D/g, ""))
      : null;

    if (tipo === "outro" && !titulo.trim()) {
      setErro("Informe o nome do serviço.");
      return;
    }

    if (intervaloNumero && kmNumero === null) {
      setErro("Informe o km do veículo hoje para avisar por quilometragem.");
      return;
    }

    try {
      setSalvando(true);
      onSalvo(
        await servicoService.registrar({
          veiculo_conta_id: Number(veiculoId),
          tipo,
          titulo: tipo === "outro" ? titulo.trim() : null,
          realizado_em: realizadoEm,
          km: kmNumero,
          valor: valor ? Number(valor.replace(",", ".")) : null,
          observacoes: observacoes.trim() || null,
          intervalo_meses: meses ? Number(meses) : null,
          intervalo_km: intervaloNumero,
        }),
      );
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(e) => void salvar(e)}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Wrench size={16} className="text-blue-600" />
            Novo serviço
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-[11px] text-gray-500">
              Veículo
              <select
                value={veiculoId}
                onChange={(e) => setVeiculoId(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              >
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.apelido?.trim() || `${v.marca} ${v.modelo}`} · {v.placa}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-[11px] text-gray-500">
              Serviço
              <select
                value={tipo}
                onChange={(e) => escolherTipo(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              >
                {tipos.map((t) => (
                  <option key={t.tipo} value={t.tipo}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {tipo === "outro" && (
            <label className="block text-[11px] text-gray-500">
              Nome do serviço
              <input
                type="text"
                value={titulo}
                maxLength={80}
                placeholder="Ex.: Pastilhas de freio"
                onChange={(e) => setTitulo(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              />
            </label>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block text-[11px] text-gray-500">
              Feito em
              <input
                type="date"
                value={realizadoEm}
                max={hojeISO()}
                onChange={(e) => setRealizadoEm(e.target.value)}
                className={`mt-1 ${classeCampo}`}
                required
              />
            </label>
            <label className="block text-[11px] text-gray-500">
              Km do veículo
              <input
                type="text"
                inputMode="numeric"
                value={km}
                placeholder="Ex.: 52300"
                onChange={(e) => setKm(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              />
            </label>
            <label className="block text-[11px] text-gray-500">
              Valor pago (R$)
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              />
            </label>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-700">
              Avisar a próxima troca
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-[11px] text-gray-500">
                Por prazo
                <select
                  value={meses}
                  onChange={(e) => setMeses(e.target.value)}
                  className={`mt-1 ${classeCampo}`}
                >
                  {OPCOES_MESES.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.texto}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-[11px] text-gray-500">
                Por quilometragem (a cada)
                <input
                  type="text"
                  inputMode="numeric"
                  value={intervaloKm}
                  placeholder="Ex.: 10000 km"
                  onChange={(e) => setIntervaloKm(e.target.value)}
                  className={`mt-1 ${classeCampo}`}
                />
              </label>
            </div>

            <p className="text-[11px] text-gray-400">
              Pode usar os dois: avisamos pelo que chegar primeiro, por e-mail,
              30 dias ou 1.000 km antes.
            </p>
          </div>

          <label className="block text-[11px] text-gray-500">
            Observações (opcional)
            <input
              type="text"
              value={observacoes}
              maxLength={255}
              placeholder="Ex.: óleo 5W30 sintético, oficina do João"
              onChange={(e) => setObservacoes(e.target.value)}
              className={`mt-1 ${classeCampo}`}
            />
          </label>

          {erro && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {erro}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar serviço"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
