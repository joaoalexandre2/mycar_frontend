import { useEffect, useState, type FormEvent } from "react";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { ShieldCheck, Trash2 } from "lucide-react";
import { seguroService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { Modal } from "../../components/ui/Modal";
import { lerNumeroBR } from "../../utils/numero";
import { formatarData, formatarMoeda } from "../../utils/formatters";
import { tipoDe } from "../../utils/tipoVeiculo";
import type {
  Seguro,
  SegurosDoVeiculo,
  TipoSeguro,
  VeiculoConta,
} from "../../types/conta";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

function textoDaReferencia(item: Seguro) {
  if (item.vsReferenciaPct === null) return null;

  const abs = Math.abs(item.vsReferenciaPct).toLocaleString("pt-BR");

  if (Math.abs(item.vsReferenciaPct) < 5) return "perto da referência";
  return item.vsReferenciaPct > 0
    ? `${abs}% acima da referência`
    : `${abs}% abaixo da referência`;
}

export function SegurosModal({
  veiculo,
  onClose,
}: {
  veiculo: VeiculoConta;
  onClose: () => void;
}) {
  const pedirConfirmacao = useConfirmar();
  const [dados, setDados] = useState<SegurosDoVeiculo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [tipo, setTipo] = useState<TipoSeguro>("proposta");
  const [seguradora, setSeguradora] = useState("");
  const [valorAnual, setValorAnual] = useState("");
  const [franquia, setFranquia] = useState("");
  const [vigenciaFim, setVigenciaFim] = useState("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    let ativo = true;

    seguroService
      .listar(veiculo.id)
      .then((resposta) => {
        if (ativo) aplicar(resposta);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [veiculo.id]);

  /**
   * Guarda a resposta do servidor e ajusta o formulário à pergunta "já tem
   * seguro?": quem tem e ainda não cadastrou o seguro atual começa por ele
   * (com o vencimento); quem não tem só cadastra propostas.
   */
  function aplicar(resposta: SegurosDoVeiculo) {
    setDados(resposta);

    if (resposta.possuiSeguro === false) {
      setTipo("proposta");
    } else if (resposta.possuiSeguro === true && resposta.apoliceAtualId === null) {
      setTipo("apolice");
    }
  }

  async function responder(possui: boolean) {
    setErro(null);

    try {
      aplicar(await seguroService.definirPossui(veiculo.id, possui));
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function registrar(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    const valorLido = lerNumeroBR(valorAnual);
    const franquiaLida = lerNumeroBR(franquia);

    if (!seguradora.trim() || valorLido.estado === "vazio") {
      setErro("Informe a seguradora e o valor anual.");
      return;
    }

    if (valorLido.estado === "invalido" || valorLido.valor <= 0) {
      setErro("Valor anual inválido: use o formato 2.500,00.");
      return;
    }

    if (franquiaLida.estado === "invalido") {
      setErro("Franquia inválida: use o formato 1.500,00 ou deixe em branco.");
      return;
    }

    const valor = valorLido.valor;
    const franquiaNumerica =
      franquiaLida.estado === "ok" ? franquiaLida.valor : null;

    if (tipo === "apolice" && !vigenciaFim) {
      setErro("Informe até quando vai o seguro atual: é com essa data que avisamos a renovação.");
      return;
    }

    try {
      setSalvando(true);
      aplicar(
        await seguroService.registrar(veiculo.id, {
          tipo,
          seguradora: seguradora.trim(),
          valor_anual: valor,
          franquia: franquiaNumerica,
          vigencia_fim: tipo === "apolice" ? vigenciaFim : null,
          observacoes: observacoes.trim() || null,
        }),
      );
      setSeguradora("");
      setValorAnual("");
      setFranquia("");
      setVigenciaFim("");
      setObservacoes("");
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: number) {
    if (!(await pedirConfirmacao({
      mensagem: "Remover este seguro da lista?",
      confirmarTexto: "Remover",
      perigo: true,
    }))) return;

    try {
      aplicar(await seguroService.remover(veiculo.id, id));
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  const nome = veiculo.apelido?.trim() || `${veiculo.marca} ${veiculo.modelo}`;
  const referencia = dados?.referencia ?? null;
  const possui = dados ? dados.possuiSeguro : null;
  const apolice = dados?.seguros.find((s) => s.id === dados.apoliceAtualId) ?? null;

  return (
    <Modal
      titulo="Seguro"
      subtitulo={`${nome} · ${veiculo.placa}`}
      icone={<ShieldCheck size={16} className="text-blue-600" />}
      larguraMax="max-w-2xl"
      onClose={onClose}
    >
      <div className="space-y-5 px-6 py-5">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-700">Este veículo já tem seguro?</p>

          {dados && possui === null && (
            <>
              <p className="mt-1 text-xs text-gray-500">
                Se tem, informe o vencimento: avisamos por e-mail antes de vencer.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void responder(true)}
                  className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Sim, já tem
                </button>
                <button
                  type="button"
                  onClick={() => void responder(false)}
                  className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Não tem
                </button>
              </div>
            </>
          )}

          {possui === true && (
            <p className="mt-2 text-xs text-gray-600">
              {apolice?.vigenciaFim ? (
                <>
                  Sim. O seguro de <strong>{apolice.seguradora}</strong> vence em{" "}
                  <strong>{formatarData(apolice.vigenciaFim)}</strong>.
                </>
              ) : (
                "Sim. Informe abaixo a seguradora e o vencimento do seguro: avisamos por e-mail 45 dias antes."
              )}
              {!apolice && (
                <button
                  type="button"
                  onClick={() => void responder(false)}
                  className="ml-2 font-semibold text-blue-600 hover:text-blue-700"
                >
                  Na verdade não tem
                </button>
              )}
            </p>
          )}

          {possui === false && (
            <p className="mt-2 text-xs text-gray-600">
              Sem seguro neste veículo. Cadastre as propostas que receber para compará-las.
              <button
                type="button"
                onClick={() => void responder(true)}
                className="ml-2 font-semibold text-blue-600 hover:text-blue-700"
              >
                Na verdade já tem
              </button>
            </p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-700">Referência de mercado</p>

          {referencia ? (
            <>
              <p className="mt-2 text-sm font-bold text-gray-900">
                {formatarMoeda(referencia.baixo)} a {formatarMoeda(referencia.alto)} por ano
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Tipicamente cerca de {formatarMoeda(referencia.medio)} por ano (
                {formatarMoeda(referencia.medio / 12)} por mês), pelo valor FIPE do
                veículo.
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              {tipoDe(veiculo.tipoVeiculo) === "caminhao"
                ? "Não há referência de mercado para caminhões. Cadastre as propostas que receber e compare uma com a outra."
                : "Para ver a referência, cadastre o veículo com a tabela FIPE: ela parte do valor do veículo."}
            </p>
          )}

          <p className="mt-2 text-xs text-gray-500">
            {dados?.aviso ??
              "É só uma referência, não uma cotação: o preço real depende do CEP, do condutor, do bônus e das coberturas."}
          </p>
        </div>

        <form
          onSubmit={(e) => void registrar(e)}
          className="space-y-3 rounded-lg border border-gray-200 p-4"
        >
          <p className="text-xs font-medium text-gray-700">Adicionar</p>

          {possui === false ? (
            <p className="text-xs text-gray-500">Proposta que recebi</p>
          ) : (
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={tipo === "proposta"}
                  onChange={() => setTipo("proposta")}
                />
                Proposta que recebi
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={tipo === "apolice"}
                  onChange={() => setTipo("apolice")}
                />
                Meu seguro atual
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block text-xs text-gray-500">
              Seguradora
              <input
                type="text"
                value={seguradora}
                maxLength={60}
                onChange={(e) => setSeguradora(e.target.value)}
                className={`mt-1 ${classeCampo}`}
                required
              />
            </label>
            <label className="block text-xs text-gray-500">
              Valor por ano (R$)
              <input
                type="text"
                inputMode="decimal"
                value={valorAnual}
                placeholder="Ex.: 2.400,00"
                onChange={(e) => setValorAnual(e.target.value)}
                className={`mt-1 ${classeCampo}`}
                required
              />
            </label>
            <label className="block text-xs text-gray-500">
              Franquia (R$, opcional)
              <input
                type="text"
                inputMode="decimal"
                value={franquia}
                onChange={(e) => setFranquia(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              />
            </label>
          </div>

          {tipo === "apolice" && (
            <label className="block text-xs text-gray-500">
              Vencimento do seguro (fim da vigência)
              <input
                type="date"
                value={vigenciaFim}
                onChange={(e) => setVigenciaFim(e.target.value)}
                className={`mt-1 ${classeCampo}`}
                required
              />
              <span className="mt-1 block text-xs text-gray-500">
                Avisamos por e-mail 45 dias antes, a hora de cotar de novo.
              </span>
            </label>
          )}

          <label className="block text-xs text-gray-500">
            Coberturas ou observações (opcional)
            <input
              type="text"
              value={observacoes}
              maxLength={255}
              placeholder="Ex.: compreensiva, carro reserva 15 dias"
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
          erro ? null : <p className="text-xs text-gray-500">Carregando...</p>
        ) : dados.seguros.length === 0 ? (
          <p className="text-xs text-gray-500">
            Nada cadastrado ainda. Adicione o seu seguro atual e as propostas
            que receber para compará-las aqui.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {dados.seguros.map((item) => {
              const referenciaTexto = textoDaReferencia(item);
              const ehAtual = item.id === dados.apoliceAtualId;
              const ehMelhor = item.id === dados.melhorPropostaId;

              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-900">
                      {item.seguradora}
                      {ehAtual && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold uppercase text-blue-700">
                          Seguro atual
                        </span>
                      )}
                      {ehMelhor && dados.seguros.filter((s) => s.tipo === "proposta").length > 1 && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold uppercase text-emerald-700">
                          Mais barata
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatarMoeda(item.valorAnual)} por ano ·{" "}
                      {formatarMoeda(item.valorMensal)} por mês
                      {item.franquia !== null && ` · franquia ${formatarMoeda(item.franquia)}`}
                    </p>
                    {item.vigenciaFim && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        Vai até {formatarData(item.vigenciaFim)}
                      </p>
                    )}
                    {item.observacoes && (
                      <p className="mt-0.5 text-xs text-gray-500">{item.observacoes}</p>
                    )}
                    {referenciaTexto && (
                      <p className="mt-0.5 text-xs text-gray-500">{referenciaTexto}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {item.economiaVsApolice !== null && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.economiaVsApolice > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.economiaVsApolice > 0
                          ? `Economiza ${formatarMoeda(item.economiaVsApolice)}/ano`
                          : item.economiaVsApolice < 0
                            ? `${formatarMoeda(Math.abs(item.economiaVsApolice))}/ano a mais`
                            : "Igual ao atual"}
                      </span>
                    )}
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
    </Modal>
  );
}
