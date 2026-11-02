import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Trash2, TriangleAlert } from "lucide-react";
import { Modal } from "../ui/Modal";
import { ocorrenciasService } from "../../services/ocorrencias";
import { mensagemErro } from "../../services/api";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { redimensionar } from "../../utils/imagem";
import { STATUS_DE_OCORRENCIA, TIPOS_DE_OCORRENCIA, type FotoDeOcorrencia, type Ocorrencia, type OcorrenciaPayload, type StatusDeOcorrencia, type TipoDeOcorrencia } from "../../types/ocorrencias";
import type { VeiculoConta } from "../../types/conta";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

interface Props {
  ocorrencia: Ocorrencia | null;
  veiculos: VeiculoConta[];
  /** Administrador e gestor informam valores e status; o motorista só descreve. */
  gerencia: boolean;
  onSalva: () => void;
  onClose: () => void;
}

/** Registro e acompanhamento de uma ocorrência, com as fotos antes e depois do reparo. */
export function OcorrenciaModal({ ocorrencia, veiculos, gerencia, onSalva, onClose }: Props) {
  const pedirConfirmacao = useConfirmar();
  const [veiculoId, setVeiculoId] = useState(String(ocorrencia?.veiculo?.id ?? ""));
  const [tipo, setTipo] = useState<TipoDeOcorrencia>(ocorrencia?.tipo ?? "avaria");
  const [dataHora, setDataHora] = useState(ocorrencia ? ocorrenciasService.horarioDoCampo(ocorrencia.dataHora) : "");
  const [local, setLocal] = useState(ocorrencia?.local ?? "");
  const [descricao, setDescricao] = useState(ocorrencia?.descricao ?? "");
  const [status, setStatus] = useState<StatusDeOcorrencia>(ocorrencia?.status ?? "aberta");
  const [prejuizo, setPrejuizo] = useState(ocorrencia?.prejuizoEstimado != null ? String(ocorrencia.prejuizoEstimado).replace(".", ",") : "");
  const [gasto, setGasto] = useState(ocorrencia?.valorGasto != null ? String(ocorrencia.valorGasto).replace(".", ",") : "");
  const [fotos, setFotos] = useState<FotoDeOcorrencia[]>(ocorrencia?.fotos ?? []);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState<"antes" | "depois" | null>(null);
  const entradaAntes = useRef<HTMLInputElement>(null);
  const entradaDepois = useRef<HTMLInputElement>(null);

  const valorDoCampo = (texto: string): number | null => {
    if (!texto.trim()) return null;

    const numero = Number(texto.replace(/\./g, "").replace(",", "."));

    return Number.isFinite(numero) ? numero : NaN;
  };

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const prejuizoNumero = valorDoCampo(prejuizo);
    const gastoNumero = valorDoCampo(gasto);

    if (!veiculoId || !dataHora || descricao.trim().length < 3) {
      setErro("Informe o veículo, a data e hora e descreva o que aconteceu.");
      return;
    }

    if (Number.isNaN(prejuizoNumero) || Number.isNaN(gastoNumero)) {
      setErro("Os valores precisam ser números.");
      return;
    }

    const payload: OcorrenciaPayload = {
      veiculoId: Number(veiculoId),
      tipo,
      dataHora,
      local: local.trim() || null,
      descricao: descricao.trim(),
      ...(gerencia ? { status, prejuizoEstimado: prejuizoNumero, valorGasto: gastoNumero } : {}),
    };

    try {
      setSalvando(true);

      if (ocorrencia) {
        await ocorrenciasService.atualizar(ocorrencia.id, payload);
      } else {
        await ocorrenciasService.criar(payload);
      }

      onSalva();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function anexar(momento: "antes" | "depois", evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!arquivo || !ocorrencia) return;

    try {
      setEnviandoFoto(momento);
      const reduzida = await redimensionar(arquivo, 1280, 0.8);
      const enviada = await ocorrenciasService.enviarFoto(ocorrencia.id, momento, reduzida);
      setFotos((atuais) => [...atuais, enviada]);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviandoFoto(null);
    }
  }

  async function removerFoto(foto: FotoDeOcorrencia) {
    if (!(await pedirConfirmacao({ mensagem: "Remover esta foto?", confirmarTexto: "Remover", perigo: true }))) return;

    try {
      await ocorrenciasService.removerFoto(foto.id);
      setFotos((atuais) => atuais.filter((f) => f.id !== foto.id));
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <Modal titulo={ocorrencia ? "Ocorrência" : "Registrar ocorrência"} icone={<TriangleAlert size={16} />} onClose={onClose} larguraMax="max-w-lg">
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ocorrencia-veiculo" className={rotulo}>Veículo</label>
            <select id="ocorrencia-veiculo" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} className={classeCampo}>
              <option value="">Escolha...</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.placa} · {v.marca} {v.modelo}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ocorrencia-tipo" className={rotulo}>Tipo</label>
            <select id="ocorrencia-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoDeOcorrencia)} className={classeCampo}>
              {Object.entries(TIPOS_DE_OCORRENCIA).map(([valor, texto]) => (
                <option key={valor} value={valor}>{texto}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ocorrencia-data" className={rotulo}>Data e hora</label>
            <input id="ocorrencia-data" type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="ocorrencia-local" className={rotulo}>Local (opcional)</label>
            <input id="ocorrencia-local" type="text" maxLength={160} value={local} onChange={(e) => setLocal(e.target.value)} className={classeCampo} />
          </div>
        </div>

        <div>
          <label htmlFor="ocorrencia-descricao" className={rotulo}>O que aconteceu</label>
          <textarea id="ocorrencia-descricao" rows={3} maxLength={2000} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500" />
        </div>

        {gerencia && (
          <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-3">
            <div>
              <label htmlFor="ocorrencia-status" className={rotulo}>Status</label>
              <select id="ocorrencia-status" value={status} onChange={(e) => setStatus(e.target.value as StatusDeOcorrencia)} className={classeCampo}>
                {Object.entries(STATUS_DE_OCORRENCIA).map(([valor, texto]) => (
                  <option key={valor} value={valor}>{texto}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ocorrencia-prejuizo" className={rotulo}>Prejuízo estimado (R$)</label>
              <input id="ocorrencia-prejuizo" type="text" inputMode="decimal" value={prejuizo} onChange={(e) => setPrejuizo(e.target.value)} className={classeCampo} />
            </div>
            <div>
              <label htmlFor="ocorrencia-gasto" className={rotulo}>Valor gasto (R$)</label>
              <input id="ocorrencia-gasto" type="text" inputMode="decimal" value={gasto} onChange={(e) => setGasto(e.target.value)} className={classeCampo} />
            </div>
            <p className="col-span-3 text-xs text-gray-500">Um valor gasto vira uma despesa de "Reparo e peças" no financeiro.</p>
          </div>
        )}

        {ocorrencia && (
          <section aria-label="Fotos" className="space-y-2">
            <p className={rotulo}>Fotos</p>
            <ul className="space-y-1">
              {fotos.map((f) => (
                <li key={f.id} className="flex items-center justify-between text-xs">
                  <span>
                    <span className="text-gray-500">{f.momento === "antes" ? "Antes do reparo" : "Depois do reparo"}:</span>{" "}
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-700">Ver foto</a>
                  </span>
                  {gerencia && (
                    <button type="button" onClick={() => void removerFoto(f)} aria-label="Remover foto" className="text-red-500 hover:text-red-600">
                      <Trash2 size={13} />
                    </button>
                  )}
                </li>
              ))}
              {fotos.length === 0 && <li className="text-xs text-gray-500">Nenhuma foto ainda.</li>}
            </ul>
            <div className="flex gap-2">
              <input ref={entradaAntes} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Anexar foto antes do reparo" onChange={(e) => void anexar("antes", e)} />
              <input ref={entradaDepois} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Anexar foto depois do reparo" onChange={(e) => void anexar("depois", e)} />
              <button type="button" onClick={() => entradaAntes.current?.click()} disabled={enviandoFoto !== null} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                <Camera size={13} /> {enviandoFoto === "antes" ? "Enviando..." : "Foto antes"}
              </button>
              <button type="button" onClick={() => entradaDepois.current?.click()} disabled={enviandoFoto !== null} className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                <Camera size={13} /> {enviandoFoto === "depois" ? "Enviando..." : "Foto depois"}
              </button>
            </div>
          </section>
        )}

        {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Fechar
          </button>
          <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
