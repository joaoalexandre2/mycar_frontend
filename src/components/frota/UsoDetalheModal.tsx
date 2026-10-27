import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Gauge, Pencil, Trash2 } from "lucide-react";
import { Modal } from "../ui/Modal";
import { CapturaHodometro } from "./CapturaHodometro";
import { usosService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { COR_DO_STATUS, descreverJanela } from "../../utils/agenda";
import { redimensionar } from "../../utils/imagem";
import { formatarKm } from "../../utils/formatters";
import { lerInteiroBR } from "../../utils/numero";
import { ROTULO_STATUS_USO, type UsoVeiculo } from "../../types/frota";

/** Foto já registrada de um momento (ver) ou botão para anexar/trocar. */
function FotoDoMomento({
  titulo,
  url,
  onAnexar,
}: {
  titulo: string;
  url: string | null;
  onAnexar: (foto: Blob) => Promise<void>;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!arquivo) return;

    try {
      setEnviando(true);
      setErro(null);
      await onAnexar(await redimensionar(arquivo, 1280, 0.8));
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <span className="text-gray-500">{titulo}:</span>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-700">
          Ver foto
        </a>
      ) : (
        <span className="text-gray-500">sem foto</span>
      )}
      <input ref={entrada} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void escolher(e)} aria-label={`Anexar foto do hodômetro (${titulo.toLowerCase()})`} />
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={enviando}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 disabled:opacity-60"
      >
        <Camera size={12} />
        {enviando ? "Enviando..." : url ? "Trocar foto" : "Anexar foto"}
      </button>
      {erro && (
        <span role="alert" className="text-red-600">
          {erro}
        </span>
      )}
    </div>
  );
}

/** Detalhe de um uso, com a saída e a chegada (km e foto do hodômetro). */
export function UsoDetalheModal({
  uso,
  onAtualizado,
  onRemovido,
  onEditar,
  onClose,
}: {
  uso: UsoVeiculo;
  onAtualizado: (uso: UsoVeiculo) => void;
  onRemovido: (id: number) => void;
  onEditar: (uso: UsoVeiculo) => void;
  onClose: () => void;
}) {
  const pedirConfirmacao = useConfirmar();
  const [km, setKm] = useState("");
  const [foto, setFoto] = useState<Blob | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const registrandoSaida = uso.status === "agendado";
  const registrandoChegada = uso.status === "em_uso";

  async function registrar() {
    setErro(null);

    const lido = lerInteiroBR(km);

    if (lido.estado !== "ok" || lido.valor < 0) {
      setErro("Informe o km do hodômetro (só números, ex.: 45200).");
      return;
    }

    try {
      setEnviando(true);
      const atualizado = registrandoSaida
        ? await usosService.registrarSaida(uso.id, lido.valor, foto)
        : await usosService.registrarChegada(uso.id, lido.valor, foto);

      setKm("");
      setFoto(null);
      onAtualizado(atualizado);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    if (!(await pedirConfirmacao({ mensagem: "Cancelar esta reserva? O horário volta a ficar livre.", confirmarTexto: "Cancelar reserva", cancelarTexto: "Manter reserva", perigo: true }))) return;

    try {
      onAtualizado(await usosService.cancelar(uso.id));
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function excluir() {
    if (!(await pedirConfirmacao({ mensagem: "Excluir este uso e as fotos do hodômetro? Não dá para desfazer.", confirmarTexto: "Excluir", perigo: true }))) return;

    try {
      await usosService.remover(uso.id);
      onRemovido(uso.id);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function anexar(momento: "saida" | "chegada", arquivo: Blob) {
    onAtualizado(await usosService.anexarFoto(uso.id, momento, arquivo));
  }

  const kmAtual = uso.veiculo?.kmAtual ?? null;

  return (
    <Modal
      titulo={uso.veiculo ? `${uso.veiculo.placa} · ${uso.veiculo.nome}` : "Uso do veículo"}
      subtitulo={descreverJanela(uso.inicioPrevisto, uso.fimPrevisto)}
      icone={<Gauge size={16} />}
      onClose={onClose}
      larguraMax="max-w-xl"
      fecharAoClicarFora
    >
      <div className="space-y-5 px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${COR_DO_STATUS[uso.status]}`}>
            {ROTULO_STATUS_USO[uso.status]}
          </span>
          {uso.origem === "planilha" && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
              Importado da planilha
            </span>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Motorista</dt>
            <dd className="mt-0.5 text-gray-800">{uso.motorista ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Centro de custo</dt>
            <dd className="mt-0.5 text-gray-800">{uso.centroCusto ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Finalidade</dt>
            <dd className="mt-0.5 text-gray-800">{uso.finalidade ?? "—"}</dd>
          </div>
          {uso.observacoes && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Observações</dt>
              <dd className="mt-0.5 whitespace-pre-line text-gray-800">{uso.observacoes}</dd>
            </div>
          )}
        </dl>

        {(uso.kmSaida !== null || uso.kmChegada !== null) && (
          <div className="space-y-2 rounded-lg bg-gray-50 px-4 py-3 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Saída</p>
                <p className="font-semibold text-gray-900">{formatarKm(uso.kmSaida)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Chegada</p>
                <p className="font-semibold text-gray-900">{formatarKm(uso.kmChegada)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Rodados</p>
                <p className="font-semibold text-gray-900">{formatarKm(uso.kmRodados)}</p>
              </div>
            </div>
            {uso.kmSaida !== null && uso.origem === "agenda" && (
              <FotoDoMomento titulo="Hodômetro na saída" url={uso.urlFotoSaida} onAnexar={(f) => anexar("saida", f)} />
            )}
            {uso.kmChegada !== null && uso.origem === "agenda" && (
              <FotoDoMomento titulo="Hodômetro na chegada" url={uso.urlFotoChegada} onAnexar={(f) => anexar("chegada", f)} />
            )}
          </div>
        )}

        {(registrandoSaida || registrandoChegada) && (
          <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
            <p className="text-xs font-semibold text-gray-800">
              {registrandoSaida ? "Registrar a saída" : "Registrar a chegada"}
            </p>

            <CapturaHodometro
              rotulo={registrandoSaida ? "Km de saída" : "Km de chegada"}
              km={km}
              onKm={setKm}
              foto={foto}
              onFoto={setFoto}
              dica={
                registrandoChegada && uso.kmSaida !== null
                  ? `Saiu com ${formatarKm(uso.kmSaida)}.`
                  : kmAtual !== null
                    ? `Último km registrado: ${formatarKm(kmAtual)}.`
                    : undefined
              }
            />

            <button
              type="button"
              onClick={() => void registrar()}
              disabled={enviando}
              className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {enviando ? "Registrando..." : registrandoSaida ? "Registrar saída" : "Registrar chegada"}
            </button>
          </div>
        )}

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {erro}
          </p>
        )}

        <div className="flex flex-wrap justify-between gap-2 border-t border-gray-100 pt-4">
          <div className="flex gap-2">
            {(uso.status === "agendado" || uso.status === "em_uso") && (
              <button
                type="button"
                onClick={() => onEditar(uso)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Pencil size={13} /> Editar
              </button>
            )}
            {uso.status === "agendado" && (
              <button
                type="button"
                onClick={() => void cancelar()}
                className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar reserva
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => void excluir()}
            className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            <Trash2 size={13} /> Excluir
          </button>
        </div>
      </div>
    </Modal>
  );
}
