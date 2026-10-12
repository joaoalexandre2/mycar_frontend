import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useNotificacoes";

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
  }) => void;
}) {
  const toast = useToast();
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

    if (!veiculoId || !descricao.trim() || Number.isNaN(valorNumerico)) {
      toast.aviso("Preencha veículo, descrição e valor.");
      return;
    }

    onSave({
      veiculoId: Number(veiculoId),
      descricao: descricao.trim(),
      status,
      valor: valorNumerico,
      dataAbertura,
    });
  }

  return (
    <Modal
      titulo={ordem ? "Editar ordem de serviço" : "Nova ordem de serviço"}
      subtitulo="Informe os dados do serviço."
      larguraMax="max-w-lg"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Veículo
            </label>
            <SelectComBusca
              valor={veiculoId}
              rotuloInicial={ordem?.veiculo ? rotuloVeiculo(ordem.veiculo) : ""}
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

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Descrição do problema / serviço
            </label>
            <textarea
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Valor
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(event) => setValor(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Data de abertura
              </label>
              <input
                type="date"
                value={dataAbertura}
                onChange={(event) => setDataAbertura(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {ordem && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as StatusOrdemServico)
                }
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-blue-500"
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
            className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white"
          >
            {ordem ? "Salvar alterações" : "Criar ordem"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
