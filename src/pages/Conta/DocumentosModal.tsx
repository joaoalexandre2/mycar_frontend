import { useEffect, useState, type FormEvent } from "react";
import { FileText, Trash2, X } from "lucide-react";
import { documentoService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { formatarData } from "../../utils/formatters";
import type {
  Documento,
  DocumentosDoVeiculo,
  SituacaoDocumento,
  TipoDocumento,
  VeiculoConta,
} from "../../types/conta";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

const SITUACAO: Record<SituacaoDocumento, { texto: string; classe: string }> = {
  em_dia: { texto: "Em dia", classe: "bg-emerald-50 text-emerald-700" },
  vence_em_breve: { texto: "Vence em breve", classe: "bg-amber-50 text-amber-700" },
  vencido: { texto: "Vencido", classe: "bg-red-50 text-red-600" },
  sem_data: { texto: "Sem data", classe: "bg-gray-100 text-gray-500" },
};

function textoDeDias(item: Documento) {
  if (item.diasParaVencer === null) return null;
  if (item.diasParaVencer < 0) return `${Math.abs(item.diasParaVencer)} dia(s) de atraso`;
  if (item.diasParaVencer === 0) return "vence hoje";
  return `em ${item.diasParaVencer} dia(s)`;
}

export function DocumentosModal({
  veiculo,
  onClose,
}: {
  veiculo: VeiculoConta;
  onClose: () => void;
}) {
  const [dados, setDados] = useState<DocumentosDoVeiculo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [tipo, setTipo] = useState<TipoDocumento>("crlv");
  const [titulo, setTitulo] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    let ativo = true;

    documentoService
      .listar(veiculo.id)
      .then((resposta) => {
        if (ativo) setDados(resposta);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [veiculo.id]);

  async function registrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    if (tipo === "outro" && !titulo.trim()) {
      setErro("Informe o nome do documento.");
      return;
    }

    try {
      setSalvando(true);
      setDados(
        await documentoService.registrar(veiculo.id, {
          tipo,
          titulo: tipo === "outro" ? titulo.trim() : null,
          vencimento: vencimento || null,
          observacoes: observacoes.trim() || null,
        }),
      );
      setTitulo("");
      setVencimento("");
      setObservacoes("");
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: number) {
    if (!window.confirm("Remover este documento da lista?")) return;

    try {
      setDados(await documentoService.remover(veiculo.id, id));
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  const nome = veiculo.apelido?.trim() || `${veiculo.marca} ${veiculo.modelo}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FileText size={16} className="text-blue-600" />
              Documentos
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              {nome} · {veiculo.placa}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-lg border border-gray-200 p-4 text-[11px] text-gray-500">
            {dados?.crlvVencimento ? (
              <p>
                Os avisos de licenciamento usam a <strong>data real do CRLV</strong>:{" "}
                {formatarData(dados.crlvVencimento)}
                {dados.estimativaLicenciamento &&
                  ` (a estimativa pela placa seria ${formatarData(dados.estimativaLicenciamento)})`}
                .
              </p>
            ) : (
              <p>
                Cadastre o CRLV com a data de vencimento para trocar a estimativa
                de licenciamento pela data real
                {dados?.estimativaLicenciamento &&
                  ` (hoje usamos ${formatarData(dados.estimativaLicenciamento)}, pelo final da placa)`}
                . Avisamos por e-mail 30 dias antes de cada vencimento.
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => void registrar(e)}
            className="space-y-3 rounded-lg border border-gray-200 p-4"
          >
            <p className="text-xs font-medium text-gray-700">Adicionar</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block text-[11px] text-gray-500">
                Documento
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoDocumento)}
                  className={`mt-1 ${classeCampo}`}
                >
                  <option value="crlv">CRLV</option>
                  <option value="vistoria">Vistoria</option>
                  <option value="outro">Outro</option>
                </select>
              </label>

              {tipo === "outro" && (
                <label className="block text-[11px] text-gray-500">
                  Nome
                  <input
                    type="text"
                    value={titulo}
                    maxLength={80}
                    placeholder="Ex.: CNH do motorista"
                    onChange={(e) => setTitulo(e.target.value)}
                    className={`mt-1 ${classeCampo}`}
                    required
                  />
                </label>
              )}

              <label className="block text-[11px] text-gray-500">
                Vence em
                <input
                  type="date"
                  value={vencimento}
                  onChange={(e) => setVencimento(e.target.value)}
                  className={`mt-1 ${classeCampo}`}
                />
              </label>
            </div>

            <label className="block text-[11px] text-gray-500">
              Observações (opcional)
              <input
                type="text"
                value={observacoes}
                maxLength={255}
                onChange={(e) => setObservacoes(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              />
            </label>

            {erro && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {erro}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={salvando}
                className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Adicionar"}
              </button>
            </div>
          </form>

          {!dados ? (
            <p className="text-xs text-gray-400">Carregando...</p>
          ) : dados.documentos.length === 0 ? (
            <p className="text-xs text-gray-400">
              Nenhum documento cadastrado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {dados.documentos.map((item) => {
                const situacao = SITUACAO[item.situacao];
                const dias = textoDeDias(item);

                return (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{item.rotulo}</p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        {item.vencimento
                          ? `Vence em ${formatarData(item.vencimento)}${dias ? ` (${dias})` : ""}`
                          : "Sem data de vencimento"}
                      </p>
                      {item.observacoes && (
                        <p className="mt-0.5 text-[11px] text-gray-400">{item.observacoes}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${situacao.classe}`}
                      >
                        {situacao.texto}
                      </span>
                      <button
                        type="button"
                        onClick={() => void remover(item.id)}
                        title="Remover"
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
