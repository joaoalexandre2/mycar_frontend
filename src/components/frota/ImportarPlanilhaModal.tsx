import { useState, type ChangeEvent } from "react";
import { Download, FileUp } from "lucide-react";
import { Modal } from "../ui/Modal";
import { ErroDePlanilha, usosService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { formatarKm } from "../../utils/formatters";
import type { ErrosDeImportacao, ResumoImportacao } from "../../types/frota";

/**
 * Importa a planilha de utilização (CSV): cada linha vira um uso já concluído,
 * com o km de saída e de chegada, e o km atual de cada veículo sobe até o maior
 * km informado. Primeiro "Conferir" (não grava nada); só depois "Importar".
 */
export function ImportarPlanilhaModal({
  onImportado,
  onClose,
}: {
  /** Chamado depois de gravar, para a agenda recarregar. */
  onImportado: () => void;
  onClose: () => void;
}) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [criarFaltantes, setCriarFaltantes] = useState(false);
  const [resumo, setResumo] = useState<ResumoImportacao | null>(null);
  const [problemas, setProblemas] = useState<ErrosDeImportacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [trabalhando, setTrabalhando] = useState(false);

  /** Qualquer mudança no arquivo ou nas opções invalida a conferência anterior. */
  function limparResultado() {
    setResumo(null);
    setProblemas(null);
    setErro(null);
  }

  function escolherArquivo(evento: ChangeEvent<HTMLInputElement>) {
    setArquivo(evento.target.files?.[0] ?? null);
    limparResultado();
  }

  async function baixarModelo() {
    try {
      const blob = await usosService.baixarModelo();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "planilha-de-utilizacao.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function enviar(simular: boolean) {
    if (!arquivo) return;

    limparResultado();

    try {
      setTrabalhando(true);
      const resultado = await usosService.importar(arquivo, { simular, criarFaltantes });
      setResumo(resultado);

      if (!simular) onImportado();
    } catch (error) {
      if (error instanceof ErroDePlanilha) {
        setProblemas(error.detalhes);
      } else {
        setErro(mensagemErro(error));
      }
    } finally {
      setTrabalhando(false);
    }
  }

  const conferido = resumo !== null && !resumo.gravado;
  const importado = resumo?.gravado === true;

  return (
    <Modal
      titulo="Importar planilha de utilização"
      subtitulo="Preencha uma planilha com as viagens já feitas e o km sobe sozinho."
      icone={<FileUp size={16} />}
      onClose={onClose}
      larguraMax="max-w-xl"
    >
      <div className="space-y-4 px-6 py-5 text-xs text-gray-700">
        <ol className="list-decimal space-y-1 pl-4 text-gray-600">
          <li>Baixe a planilha-modelo e preencha uma linha por viagem (placa, datas, km de saída e de chegada).</li>
          <li>Salve como <strong>CSV</strong> e escolha o arquivo abaixo.</li>
          <li>Clique em <strong>Conferir</strong>: o sistema avisa as linhas com problema sem gravar nada.</li>
        </ol>

        <button
          type="button"
          onClick={() => void baixarModelo()}
          className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Download size={14} /> Baixar planilha-modelo
        </button>

        <div>
          <label htmlFor="planilha-arquivo" className="mb-1.5 block font-medium text-gray-700">
            Planilha (CSV)
          </label>
          <input
            id="planilha-arquivo"
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={escolherArquivo}
            className="block w-full text-xs file:mr-3 file:h-9 file:rounded-lg file:border file:border-gray-200 file:bg-white file:px-3 file:text-xs file:font-semibold file:text-gray-700"
          />
        </div>

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={criarFaltantes}
            onChange={(e) => {
              setCriarFaltantes(e.target.checked);
              limparResultado();
            }}
            className="mt-0.5"
          />
          <span>
            Cadastrar automaticamente os motoristas e centros de custo que ainda não existirem.
            <span className="block text-xs text-gray-500">
              Sem isso, nome desconhecido é apontado como erro (evita duplicar por erro de digitação).
            </span>
          </span>
        </label>

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-red-600">
            {erro}
          </p>
        )}

        {problemas && (
          <div role="alert" className="rounded-lg bg-red-50 px-3 py-3 text-red-700">
            <p className="font-semibold">{problemas.mensagem}</p>
            <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-4">
              {problemas.erros.map((linha) => (
                <li key={linha}>{linha}</li>
              ))}
            </ul>
            {problemas.totalDeErros > problemas.erros.length && (
              <p className="mt-2">
                ... e mais {problemas.totalDeErros - problemas.erros.length}. Corrija os primeiros e confira de novo.
              </p>
            )}
          </div>
        )}

        {resumo && (
          <div className="rounded-lg bg-emerald-50 px-3 py-3 text-emerald-800">
            <p className="font-semibold">
              {importado ? "Planilha importada." : "Tudo certo na conferência. Nada foi gravado ainda."}
            </p>
            <p className="mt-1">
              {resumo.usos} {resumo.usos === 1 ? "uso" : "usos"} em {resumo.veiculos}{" "}
              {resumo.veiculos === 1 ? "veículo" : "veículos"}, {formatarKm(resumo.kmRodados)} rodados.
            </p>
            {resumo.motoristasNovos.length > 0 && <p>Motoristas novos: {resumo.motoristasNovos.join(", ")}.</p>}
            {resumo.centrosNovos.length > 0 && <p>Centros de custo novos: {resumo.centrosNovos.join(", ")}.</p>}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-200 px-4 font-semibold text-gray-600 hover:bg-gray-50"
          >
            {importado ? "Fechar" : "Cancelar"}
          </button>

          {!importado && (
            <button
              type="button"
              onClick={() => void enviar(true)}
              disabled={!arquivo || trabalhando}
              className="h-10 rounded-lg border border-blue-200 px-4 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
            >
              {trabalhando && !conferido ? "Conferindo..." : "Conferir"}
            </button>
          )}

          {conferido && (
            <button
              type="button"
              onClick={() => void enviar(false)}
              disabled={trabalhando}
              className="h-10 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {trabalhando ? "Importando..." : `Importar ${resumo?.usos} ${resumo?.usos === 1 ? "uso" : "usos"}`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
