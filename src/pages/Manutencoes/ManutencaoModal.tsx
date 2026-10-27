import { useEffect, useId, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useNotificacoes";
import { useEnvio } from "../../hooks/useEnvio";
import { Plus, Trash2 } from "lucide-react";
import type { Manutencao, PecaManutencao } from "../../types/manutencao";
import { veiculosService } from "../../services/veiculos";
import { SelectComBusca } from "../../components/ui/SelectComBusca";
import { rotuloVeiculo } from "../../utils/rotulos";
import { pecasService, type Peca } from "../../services/pecas";
import { hojeISO } from "../../utils/formatters";

/** Linha de peça enquanto o formulário está aberto (marca como texto). */
interface PecaEditavel {
  tipo: string;
  especificacao: string;
  marca: string;
}

export function ManutencaoModal({
  manutencao,
  onClose,
  onSave,
}: {
  manutencao: Manutencao | null;
  onClose: () => void;
  onSave: (dados: {
    veiculoId: number;
    tipo: string;
    descricao: string;
    valor: number | null;
    dataManutencao: string;
    quilometragem: number | null;
    proximaData: string | null;
    proximaQuilometragem: number | null;
    pecas: PecaManutencao[];
  }) => void | Promise<void>;
}) {
  const toast = useToast();
  const { enviando, enviar } = useEnvio();
  const idTipo = useId();
  const idDescricao = useId();
  const idValor = useId();
  const idData = useId();
  const idProximaData = useId();
  const idKm = useId();
  const idProximaKm = useId();
  const [veiculoId, setVeiculoId] = useState(
    manutencao?.veiculoId?.toString() ?? "",
  );

  // Peças usadas no serviço. "marca" fica como texto enquanto se edita e só
  // vira null ao salvar.
  const [pecas, setPecas] = useState<PecaEditavel[]>(
    (manutencao?.pecas ?? []).map((peca) => ({
      tipo: peca.tipo,
      especificacao: peca.especificacao,
      marca: peca.marca ?? "",
    })),
  );
  const [tiposPeca, setTiposPeca] = useState<Record<string, string>>({});
  const [pecasDoVeiculo, setPecasDoVeiculo] = useState<Peca[]>([]);

  useEffect(() => {
    if (!veiculoId) {
      return;
    }

    let ativo = true;

    pecasService
      .listar(Number(veiculoId))
      .then((resposta) => {
        if (!ativo) return;
        setTiposPeca(resposta.tipos);
        setPecasDoVeiculo(resposta.pecas);
      })
      .catch(() => {
        // Sem a lista só perdemos as sugestões: o formulário segue válido.
      });

    return () => {
      ativo = false;
    };
  }, [veiculoId]);

  // Sugestão do que já foi usado neste veículo para o tipo escolhido. Ignora
  // as peças desta própria manutenção (ao editar, seriam a própria linha).
  function sugestaoPara(tipoPeca: string): Peca | undefined {
    const doutras = pecasDoVeiculo.filter(
      (peca) =>
        peca.tipo === tipoPeca &&
        (!manutencao || peca.manutencao_id !== manutencao.id),
    );

    return (
      doutras.find((peca) => peca.fonte === "servico") ??
      doutras.find((peca) => peca.fonte === "ficha")
    );
  }

  function alterarPeca(indice: number, campos: Partial<PecaEditavel>) {
    setPecas((atuais) =>
      atuais.map((peca, i) => (i === indice ? { ...peca, ...campos } : peca)),
    );
  }

  const [tipo, setTipo] = useState(
    manutencao?.tipo ?? "",
  );

  const [descricao, setDescricao] = useState(
    manutencao?.descricao ?? "",
  );

  const [dataManutencao, setDataManutencao] = useState(
    manutencao?.dataManutencao ?? hojeISO(),
  );

  const [proximaData, setProximaData] = useState(
    manutencao?.proximaData ?? "",
  );

  const [quilometragem, setQuilometragem] = useState(
    manutencao?.quilometragem?.toString() ?? "",
  );

  const [proximaQuilometragem, setProximaQuilometragem] = useState(
    manutencao?.proximaQuilometragem?.toString() ?? "",
  );

  const [valor, setValor] = useState(
    manutencao?.valor?.toString() ?? "",
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!veiculoId || !tipo.trim() || !descricao.trim() || !dataManutencao) {
      toast.aviso(
        "Preencha veículo, tipo, descrição e data da manutenção.",
      );

      return;
    }

    const quilometragemNumerica =
      quilometragem === "" ? null : Number(quilometragem);

    const proximaQuilometragemNumerica =
      proximaQuilometragem === "" ? null : Number(proximaQuilometragem);

    const valorNumerico = valor === "" ? null : Number(valor);

    if (
      (quilometragemNumerica !== null &&
        (Number.isNaN(quilometragemNumerica) || quilometragemNumerica < 0)) ||
      (proximaQuilometragemNumerica !== null &&
        (Number.isNaN(proximaQuilometragemNumerica) ||
          proximaQuilometragemNumerica < 0)) ||
      (valorNumerico !== null &&
        (Number.isNaN(valorNumerico) || valorNumerico < 0))
    ) {
      toast.aviso("Informe valores numéricos válidos.");

      return;
    }

    // Linhas totalmente vazias são ignoradas; as parciais pedem correção.
    const linhasPreenchidas = pecas.filter(
      (peca) => peca.tipo || peca.especificacao.trim() || peca.marca.trim(),
    );

    if (
      linhasPreenchidas.some(
        (peca) => !peca.tipo || !peca.especificacao.trim(),
      )
    ) {
      toast.aviso(
        "Em cada peça, escolha o tipo e informe o código ou a especificação (ou remova a linha).",
      );

      return;
    }

    void enviar(() =>
      onSave({
        pecas: linhasPreenchidas.map((peca) => ({
          tipo: peca.tipo,
          especificacao: peca.especificacao.trim(),
          marca: peca.marca.trim() || null,
        })),
        veiculoId: Number(veiculoId),
        tipo: tipo.trim(),
        descricao: descricao.trim(),
        valor: valorNumerico,
        dataManutencao,
        quilometragem: quilometragemNumerica,
        proximaData: proximaData || null,
        proximaQuilometragem: proximaQuilometragemNumerica,
      }),
    );
  }

  return (
    <Modal
      titulo={manutencao ? "Editar manutenção" : "Nova manutenção"}
      subtitulo="Cadastre os dados do acompanhamento."
      larguraMax="max-w-lg"
      onClose={onClose}
    >
      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          {/* Veículo */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-700">
              Veículo
            </span>

            <SelectComBusca
              rotulo="Veículo"
              valor={veiculoId}
              rotuloInicial={
                manutencao?.veiculo ? rotuloVeiculo(manutencao.veiculo) : ""
              }
              placeholder="Busque por placa, modelo ou cliente"
              buscar={async (termo) =>
                (await veiculosService.buscar(termo)).map((veiculo) => ({
                  id: veiculo.id,
                  rotulo: rotuloVeiculo(veiculo),
                }))
              }
              onChange={setVeiculoId}
            />
          </div>

          {/* Tipo */}
          <div>
            <label
              htmlFor={idTipo}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Tipo de manutenção
            </label>

            <input
              id={idTipo}
              type="text"
              value={tipo}
              onChange={(event) =>
                setTipo(event.target.value)
              }
              placeholder="Ex.: Troca de óleo"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label
              htmlFor={idDescricao}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Descrição
            </label>

            <textarea
              id={idDescricao}
              value={descricao}
              onChange={(event) =>
                setDescricao(event.target.value)
              }
              placeholder="Descreva a manutenção..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-700 outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Valor */}
          <div>
            <label
              htmlFor={idValor}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Valor (opcional)
            </label>

            <input
              id={idValor}
              type="number"
              min="0"
              step="0.01"
              value={valor}
              onChange={(event) => setValor(event.target.value)}
              placeholder="Ex.: 250.00"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={idData}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Data da manutenção
              </label>

              <input
                id={idData}
                type="date"
                value={dataManutencao}
                onChange={(event) =>
                  setDataManutencao(event.target.value)
                }
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor={idProximaData}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Próxima manutenção (opcional)
              </label>

              <input
                id={idProximaData}
                type="date"
                value={proximaData}
                onChange={(event) =>
                  setProximaData(event.target.value)
                }
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* KM */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={idKm}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                KM atual (opcional)
              </label>

              <input
                id={idKm}
                type="number"
                min="0"
                value={quilometragem}
                onChange={(event) =>
                  setQuilometragem(event.target.value)
                }
                placeholder="Ex.: 50000"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor={idProximaKm}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Próxima KM (opcional)
              </label>

              <input
                id={idProximaKm}
                type="number"
                min="0"
                value={proximaQuilometragem}
                onChange={(event) =>
                  setProximaQuilometragem(event.target.value)
                }
                placeholder="Ex.: 60000"
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Peças usadas */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-700">
                  Peças usadas (opcional)
                </p>

                <p className="mt-1 text-[11px] text-gray-400">
                  Ficam registradas no veículo, sem precisar cadastrar de
                  novo.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPecas((atuais) => [
                    ...atuais,
                    { tipo: "", especificacao: "", marca: "" },
                  ])
                }
                disabled={!veiculoId}
                title={
                  veiculoId ? undefined : "Selecione o veículo primeiro"
                }
                className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={13} />
                Adicionar
              </button>
            </div>

            {!veiculoId && pecas.length === 0 && (
              <p className="mt-3 text-[11px] text-gray-400">
                Selecione o veículo para registrar as peças.
              </p>
            )}

            {pecas.length > 0 && (
              <div className="mt-3 space-y-3">
                {pecas.map((peca, indice) => {
                  const sugestao = peca.tipo
                    ? sugestaoPara(peca.tipo)
                    : undefined;

                  return (
                    <div
                      key={indice}
                      className="space-y-2 rounded-lg bg-gray-50 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <select
                          value={peca.tipo}
                          onChange={(event) =>
                            alterarPeca(indice, { tipo: event.target.value })
                          }
                          aria-label="Tipo da peça"
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                        >
                          <option value="">Tipo da peça</option>

                          {Object.entries(tiposPeca).map(([chave, rotulo]) => (
                            <option key={chave} value={chave}>
                              {rotulo}
                            </option>
                          ))}

                          {/* Mantém visível o tipo de uma peça já salva enquanto a lista não chega. */}
                          {peca.tipo && !tiposPeca[peca.tipo] && (
                            <option value={peca.tipo}>{peca.tipo}</option>
                          )}
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            setPecas((atuais) =>
                              atuais.filter((_, i) => i !== indice),
                            )
                          }
                          title="Remover peça"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          value={peca.especificacao}
                          onChange={(event) =>
                            alterarPeca(indice, {
                              especificacao: event.target.value,
                            })
                          }
                          maxLength={120}
                          placeholder="Código ou especificação"
                          aria-label="Código ou especificação da peça"
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                        />

                        <input
                          type="text"
                          value={peca.marca}
                          onChange={(event) =>
                            alterarPeca(indice, { marca: event.target.value })
                          }
                          maxLength={60}
                          placeholder="Marca (opcional)"
                          aria-label="Marca da peça"
                          className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                        />
                      </div>

                      {sugestao && (
                        <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-gray-500">
                          <span>
                            {sugestao.fonte === "servico"
                              ? "Da última vez usamos"
                              : "Referência do veículo"}
                            :{" "}
                            <strong className="font-semibold text-gray-700">
                              {sugestao.especificacao}
                            </strong>
                            {sugestao.marca ? ` (${sugestao.marca})` : ""}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              alterarPeca(indice, {
                                especificacao: sugestao.especificacao,
                                marca: sugestao.marca ?? "",
                              })
                            }
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            Usar a mesma
                          </button>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={enviando}
            className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "Salvando..."
              : manutencao
                ? "Salvar alterações"
                : "Criar manutenção"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
