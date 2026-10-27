import { useId, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { useEnvio } from "../../hooks/useEnvio";
import { useErrosDeCampo } from "../../hooks/useErrosDeCampo";
import { ErroDoCampo } from "../../components/ui/ErroDoCampo";

import type {
  OrdemServico,
  StatusOrdemServico,
} from "../../types/ordemServico";
import { veiculosService } from "../../services/veiculos";
import { SelectComBusca } from "../../components/ui/SelectComBusca";
import { rotuloVeiculo } from "../../utils/rotulos";
import { hojeISO } from "../../utils/formatters";

export function OrdemServicoModal({
  ordem,
  onClose,
  onSave,
}: {
  ordem: OrdemServico | null;
  onClose: () => void;
  onSave: (dados: {
    veiculoId: number;
    descricao: string;
    status: StatusOrdemServico;
    valor: number;
    dataAbertura: string;
  }) => void | Promise<void>;
}) {
  const { enviando, enviar } = useEnvio();
  const { erros, mostrar, limpar, atributos } = useErrosDeCampo();
  const idVeiculo = useId();
  const idDescricao = useId();
  const idValor = useId();
  const idData = useId();
  const idStatus = useId();
  const [veiculoId, setVeiculoId] = useState(
    ordem?.veiculoId?.toString() ?? "",
  );
  const [descricao, setDescricao] = useState(ordem?.descricao ?? "");
  const [status, setStatus] = useState<StatusOrdemServico>(
    ordem?.status ?? "aberta",
  );
  const [valor, setValor] = useState(ordem?.valor?.toString() ?? "");
  const [dataAbertura, setDataAbertura] = useState(
    ordem?.dataAbertura ?? hojeISO(),
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valorNumerico = Number(valor);

    const novos: Record<string, string> = {};

    if (!veiculoId) novos[idVeiculo] = "Escolha o veículo da ordem.";
    if (!descricao.trim()) novos[idDescricao] = "Descreva o problema ou o serviço.";
    if (!valor.trim()) {
      novos[idValor] = "Informe o valor da ordem.";
    } else if (Number.isNaN(valorNumerico) || valorNumerico < 0) {
      novos[idValor] = "Informe um valor igual ou maior que zero.";
    }
    if (!dataAbertura) novos[idData] = "Informe a data de abertura.";

    if (Object.keys(novos).length > 0) {
      mostrar(novos, [idVeiculo, idDescricao, idValor, idData]);
      return;
    }

    void enviar(() =>
      onSave({
        veiculoId: Number(veiculoId),
        descricao: descricao.trim(),
        status,
        valor: valorNumerico,
        dataAbertura,
      }),
    );
  }

  return (
    <Modal
      titulo={ordem ? "Editar ordem de serviço" : "Nova ordem de serviço"}
      subtitulo="Informe os dados do serviço."
      larguraMax="max-w-lg"
      onClose={onClose}
    >
      <form noValidate onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-gray-700">
              Veículo
            </span>
            <SelectComBusca
              id={idVeiculo}
              rotulo="Veículo"
              invalido={Boolean(erros[idVeiculo])}
              descritoPor={atributos(idVeiculo)["aria-describedby"]}
              valor={veiculoId}
              rotuloInicial={ordem?.veiculo ? rotuloVeiculo(ordem.veiculo) : ""}
              placeholder="Busque por placa, modelo ou cliente"
              buscar={async (termo) =>
                (await veiculosService.buscar(termo)).map((veiculo) => ({
                  id: veiculo.id,
                  rotulo: rotuloVeiculo(veiculo),
                }))
              }
              onChange={(novo) => {
                setVeiculoId(novo);
                limpar(idVeiculo);
              }}
            />
            <ErroDoCampo campo={idVeiculo} mensagem={erros[idVeiculo]} />
          </div>

          <div>
            <label
              htmlFor={idDescricao}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Descrição do problema / serviço
            </label>
            <textarea
              id={idDescricao}
              {...atributos(idDescricao)}
              value={descricao}
              onChange={(event) => {
                setDescricao(event.target.value);
                limpar(idDescricao);
              }}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-blue-500 aria-invalid:border-red-500"
              required
            />
            <ErroDoCampo campo={idDescricao} mensagem={erros[idDescricao]} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={idValor}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Valor
              </label>
              <input
                id={idValor}
                type="number"
                min="0"
                step="0.01"
                {...atributos(idValor)}
                value={valor}
                onChange={(event) => {
                  setValor(event.target.value);
                  limpar(idValor);
                }}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-500 aria-invalid:border-red-500"
                required
              />
              <ErroDoCampo campo={idValor} mensagem={erros[idValor]} />
            </div>
            <div>
              <label
                htmlFor={idData}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Data de abertura
              </label>
              <input
                id={idData}
                type="date"
                {...atributos(idData)}
                value={dataAbertura}
                onChange={(event) => {
                  setDataAbertura(event.target.value);
                  limpar(idData);
                }}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-500 aria-invalid:border-red-500"
                required
              />
              <ErroDoCampo campo={idData} mensagem={erros[idData]} />
            </div>
          </div>

          {ordem && (
            <div>
              <label
                htmlFor={idStatus}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id={idStatus}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StatusOrdemServico)
                }
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-blue-500 aria-invalid:border-red-500"
              >
                <option value="aberta">Aberta</option>
                <option value="em_andamento">Em andamento</option>
                <option value="aguardando_peca">Aguardando peça</option>
                <option value="finalizada">Finalizada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600"
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
              : ordem
                ? "Salvar alterações"
                : "Criar ordem"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
