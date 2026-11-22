import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Trash2, TriangleAlert } from "lucide-react";
import { Alert } from "../ui/Alert";
import { Modal } from "../ui/Modal";
import { ocorrenciasService } from "../../services/ocorrencias";
import { mensagemErro } from "../../services/api";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { redimensionar } from "../../utils/imagem";
import { lerValorEmReais, valorEmReaisParaCampo } from "../../utils/numero";
import { CampoEmReais } from "./CampoEmReais";
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
  /**
   * Chamado ao criar: o modal continua aberto, já no registro novo, para anexar
   * as fotos. A página atualiza a lista por trás sem fechar o modal.
   */
  onCriada?: (criada: Ocorrencia) => void;
  onClose: () => void;
}

type CampoObrigatorio = "veiculo" | "dataHora" | "descricao";

/** Registro e acompanhamento de uma ocorrência, com as fotos antes e depois do reparo. */
export function OcorrenciaModal({ ocorrencia, veiculos, gerencia, onSalva, onCriada, onClose }: Props) {
  const pedirConfirmacao = useConfirmar();
  const [veiculoId, setVeiculoId] = useState(String(ocorrencia?.veiculo?.id ?? ""));
  const [tipo, setTipo] = useState<TipoDeOcorrencia>(ocorrencia?.tipo ?? "avaria");
  const [dataHora, setDataHora] = useState(ocorrencia ? ocorrenciasService.horarioDoCampo(ocorrencia.dataHora) : "");
  const [local, setLocal] = useState(ocorrencia?.local ?? "");
  const [descricao, setDescricao] = useState(ocorrencia?.descricao ?? "");
  const [status, setStatus] = useState<StatusDeOcorrencia>(ocorrencia?.status ?? "aberta");
  // O valor do servidor volta ao campo no formato que lerValorEmReais lê de novo ("1500,50").
  const [prejuizo, setPrejuizo] = useState(valorEmReaisParaCampo(ocorrencia?.prejuizoEstimado));
  const [gasto, setGasto] = useState(valorEmReaisParaCampo(ocorrencia?.valorGasto));
  const [erroPrejuizo, setErroPrejuizo] = useState<string | null>(null);
  const [erroGasto, setErroGasto] = useState<string | null>(null);
  const [fotos, setFotos] = useState<FotoDeOcorrencia[]>(ocorrencia?.fotos ?? []);
  const [erro, setErro] = useState<string | null>(null);
  const [errosDosCampos, setErrosDosCampos] = useState<Partial<Record<CampoObrigatorio, string>>>({});
  // O registro em edição: o que veio da lista ou o que acabou de ser criado aqui.
  const [registro, setRegistro] = useState<Ocorrencia | null>(ocorrencia);
  const [recemCriada, setRecemCriada] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState<"antes" | "depois" | null>(null);
  const entradaAntes = useRef<HTMLInputElement>(null);
  const entradaDepois = useRef<HTMLInputElement>(null);
  const campoVeiculo = useRef<HTMLSelectElement>(null);
  const campoData = useRef<HTMLInputElement>(null);
  const campoDescricao = useRef<HTMLTextAreaElement>(null);
  const avisoDeSucesso = useRef<HTMLDivElement>(null);

  // Depois de criar, o botão Salvar pode sumir (o motorista não edita): o foco vai
  // para o aviso, que o leitor de tela lê, em vez de se perder no corpo da página.
  useEffect(() => {
    if (recemCriada) avisoDeSucesso.current?.focus();
  }, [recemCriada]);

  function limparErroDoCampo(campo: CampoObrigatorio) {
    setErrosDosCampos((atuais) => (atuais[campo] ? { ...atuais, [campo]: undefined } : atuais));
  }

  /** Liga o campo à mensagem de erro dele, logo abaixo. */
  function atributosDeErro(campo: CampoObrigatorio, id: string) {
    return errosDosCampos[campo] ? { "aria-invalid": true as const, "aria-describedby": `${id}-erro` } : {};
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const faltando: Partial<Record<CampoObrigatorio, string>> = {};
    if (!veiculoId) faltando.veiculo = "Escolha o veículo.";
    if (!dataHora) faltando.dataHora = "Informe a data e a hora.";
    if (descricao.trim().length < 3) faltando.descricao = "Descreva o que aconteceu (pelo menos 3 caracteres).";
    setErrosDosCampos(faltando);

    if (faltando.veiculo || faltando.dataHora || faltando.descricao) {
      // Foco no primeiro que falta, na ordem em que aparecem na tela.
      (faltando.veiculo ? campoVeiculo : faltando.dataHora ? campoData : campoDescricao).current?.focus();
      return;
    }

    const prejuizoLido = lerValorEmReais(prejuizo);
    const gastoLido = lerValorEmReais(gasto);

    // Só quem gerencia vê e envia os valores; para o motorista eles nem vão no payload.
    if (gerencia && (prejuizoLido.estado === "invalido" || gastoLido.estado === "invalido")) {
      setErroPrejuizo(prejuizoLido.estado === "invalido" ? prejuizoLido.mensagem : null);
      setErroGasto(gastoLido.estado === "invalido" ? gastoLido.mensagem : null);
      setErro("Corrija os valores destacados.");
      return;
    }

    const prejuizoNumero = prejuizoLido.estado === "ok" ? prejuizoLido.valor : null;
    const gastoNumero = gastoLido.estado === "ok" ? gastoLido.valor : null;

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

      if (registro) {
        await ocorrenciasService.atualizar(registro.id, payload);
        onSalva();
        return;
      }

      // Ao criar, o modal não fecha: logo depois do dano é a hora de fotografar.
      const criada = await ocorrenciasService.criar(payload);
      setRegistro(criada);
      setFotos(criada.fotos ?? []);
      setRecemCriada(true);
      onCriada?.(criada);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function anexar(momento: "antes" | "depois", evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!arquivo || !registro) return;

    try {
      setEnviandoFoto(momento);
      const reduzida = await redimensionar(arquivo, 1280, 0.8);
      const enviada = await ocorrenciasService.enviarFoto(registro.id, momento, reduzida);
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
    <Modal titulo={registro ? "Ocorrência" : "Registrar ocorrência"} icone={<TriangleAlert size={16} />} onClose={onClose} larguraMax="max-w-lg">
      <form onSubmit={(e) => void salvar(e)} noValidate className="space-y-4 px-6 py-5">
        {recemCriada && (
          <Alert ref={avisoDeSucesso} tone="success" tabIndex={-1} className="outline-none">
            Ocorrência registrada. Agora você pode anexar as fotos de antes e depois.
          </Alert>
        )}

        {/* O motorista não edita ocorrência já registrada (a rota de edição é só da gestão): depois de criar, os dados ficam só para leitura. */}
        <fieldset disabled={recemCriada && !gerencia} className="min-w-0 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="ocorrencia-veiculo" className={rotulo}>Veículo</label>
            <select
              ref={campoVeiculo}
              id="ocorrencia-veiculo"
              value={veiculoId}
              onChange={(e) => {
                setVeiculoId(e.target.value);
                limparErroDoCampo("veiculo");
              }}
              {...atributosDeErro("veiculo", "ocorrencia-veiculo")}
              className={`${classeCampo} aria-invalid:border-red-400`}
            >
              <option value="">Escolha...</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.placa} · {v.marca} {v.modelo}</option>
              ))}
            </select>
            {errosDosCampos.veiculo && <p id="ocorrencia-veiculo-erro" className="mt-1 text-xs text-red-600">{errosDosCampos.veiculo}</p>}
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
            <input
              ref={campoData}
              id="ocorrencia-data"
              type="datetime-local"
              value={dataHora}
              onChange={(e) => {
                setDataHora(e.target.value);
                limparErroDoCampo("dataHora");
              }}
              {...atributosDeErro("dataHora", "ocorrencia-data")}
              className={`${classeCampo} aria-invalid:border-red-400`}
            />
            {errosDosCampos.dataHora && <p id="ocorrencia-data-erro" className="mt-1 text-xs text-red-600">{errosDosCampos.dataHora}</p>}
          </div>
          <div>
            <label htmlFor="ocorrencia-local" className={rotulo}>Local (opcional)</label>
            <input id="ocorrencia-local" type="text" maxLength={160} value={local} onChange={(e) => setLocal(e.target.value)} className={classeCampo} />
          </div>
        </div>

        <div>
          <label htmlFor="ocorrencia-descricao" className={rotulo}>O que aconteceu</label>
          <textarea
            ref={campoDescricao}
            id="ocorrencia-descricao"
            rows={3}
            maxLength={2000}
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value);
              limparErroDoCampo("descricao");
            }}
            {...atributosDeErro("descricao", "ocorrencia-descricao")}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500 aria-invalid:border-red-400"
          />
          {errosDosCampos.descricao && <p id="ocorrencia-descricao-erro" className="mt-1 text-xs text-red-600">{errosDosCampos.descricao}</p>}
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
            <CampoEmReais
              id="ocorrencia-prejuizo"
              rotulo="Prejuízo estimado (R$)"
              valor={prejuizo}
              onChange={(texto) => {
                setPrejuizo(texto);
                setErroPrejuizo(null);
              }}
              erro={erroPrejuizo}
              classeCampo={classeCampo}
              classeRotulo={rotulo}
            />
            <CampoEmReais
              id="ocorrencia-gasto"
              rotulo="Valor gasto (R$)"
              valor={gasto}
              onChange={(texto) => {
                setGasto(texto);
                setErroGasto(null);
              }}
              erro={erroGasto}
              classeCampo={classeCampo}
              classeRotulo={rotulo}
            />
            <p className="col-span-3 text-xs text-gray-500">Um valor gasto vira uma despesa de "Reparo e peças" no financeiro.</p>
          </div>
        )}
        </fieldset>

        {registro && (
          <section aria-label="Fotos" className="space-y-2">
            <p className={rotulo}>Fotos</p>
            <ul className="space-y-1">
              {fotos.map((f) => (
                <li key={f.id} className="flex items-center justify-between text-xs">
                  <span>
                    <span className="text-gray-500">{f.momento === "antes" ? "Antes do reparo" : "Depois do reparo"}:</span>{" "}
                    <a href={f.url} target="_blank" rel="noopener noreferrer" aria-label={`Ver foto de ${f.momento}`} className="inline-flex h-11 items-center font-semibold text-blue-600 hover:text-blue-700 md:h-9">Ver foto</a>
                  </span>
                  {gerencia && (
                    <button type="button" onClick={() => void removerFoto(f)} aria-label={`Remover foto de ${f.momento}`} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 md:h-9 md:w-9">
                      <Trash2 size={13} />
                    </button>
                  )}
                </li>
              ))}
              {fotos.length === 0 && <li className="text-xs text-gray-500">Nenhuma foto ainda.</li>}
            </ul>
            <div className="flex flex-wrap gap-2">
              <input ref={entradaAntes} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Anexar foto antes do reparo" onChange={(e) => void anexar("antes", e)} />
              <input ref={entradaDepois} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Anexar foto depois do reparo" onChange={(e) => void anexar("depois", e)} />
              <button type="button" onClick={() => entradaAntes.current?.click()} disabled={enviandoFoto !== null} className="flex h-11 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 md:h-9">
                <Camera size={13} /> {enviandoFoto === "antes" ? "Enviando..." : "Foto antes"}
              </button>
              <button type="button" onClick={() => entradaDepois.current?.click()} disabled={enviandoFoto !== null} className="flex h-11 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 md:h-9">
                <Camera size={13} /> {enviandoFoto === "depois" ? "Enviando..." : "Foto depois"}
              </button>
            </div>
          </section>
        )}

        {erro && <Alert tone="danger">{erro}</Alert>}

        <div className="flex justify-end gap-2">
          {recemCriada ? (
            <>
              {/* Quem gerencia ainda pode ajustar status e valores do registro novo. */}
              {gerencia && (
                <button type="submit" disabled={salvando} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                  {salvando ? "Salvando..." : "Salvar alterações"}
                </button>
              )}
              <button type="button" onClick={onClose} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
                Concluir
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                Fechar
              </button>
              <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}
