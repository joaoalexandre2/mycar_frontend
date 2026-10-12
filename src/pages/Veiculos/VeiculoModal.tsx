import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../hooks/useNotificacoes";

import { clientesService } from "../../services/clientes";
import { SelectComBusca } from "../../components/ui/SelectComBusca";
import type { Veiculo } from "../../types/veiculo";
import {
  FipeSeletor,
  type FipeSelecao,
} from "../../components/veiculos/FipeSeletor";
import { ESTADOS } from "../../utils/estados";
import {
  limparPlaca,
  padraoDaPlaca,
  placaValida,
  ROTULO_PADRAO,
} from "../../utils/placa";

export interface DadosVeiculoForm {
  clienteId: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  anoFabricacao: number | null;
  uf: string;
  fipe: FipeSelecao;
}

export function VeiculoModal({
  veiculo,
  onClose,
  onSave,
}: {
  veiculo: Veiculo | null;
  onClose: () => void;
  onSave: (veiculo: DadosVeiculoForm) => void;
}) {
  const toast = useToast();
  const [clienteId, setClienteId] = useState(
    veiculo?.clienteId?.toString() ?? "",
  );
  const [placa, setPlaca] = useState(veiculo?.placa ?? "");
  const [marca, setMarca] = useState(veiculo?.marca ?? "");
  const [modelo, setModelo] = useState(veiculo?.modelo ?? "");
  const [ano, setAno] = useState(veiculo?.ano?.toString() ?? "");
  const [anoFab, setAnoFab] = useState(veiculo?.anoFabricacao?.toString() ?? "");
  const [uf, setUf] = useState(veiculo?.uf ?? "");
  const [fipe, setFipe] = useState<FipeSelecao>({
    marcaId: veiculo?.fipeMarcaId?.toString() ?? "",
    modeloId: veiculo?.fipeModeloId?.toString() ?? "",
    ano: veiculo?.fipeAno ?? "",
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const anoNumerico = Number(ano);
    const anoMaximo = new Date().getFullYear() + 1; // ano modelo pode ser o do ano seguinte

    if (!placaValida(placa)) {
      toast.aviso("Placa inválida. Use o padrão antigo (ABC1234) ou o Mercosul (ABC1D23).");
      return;
    }

    if (
      !clienteId ||
      !placa.trim() ||
      !marca.trim() ||
      !modelo.trim() ||
      Number.isNaN(anoNumerico) ||
      anoNumerico < 1900 ||
      anoNumerico > anoMaximo
    ) {
      toast.aviso(`Informe os dados do veículo com ano modelo entre 1900 e ${anoMaximo}.`);
      return;
    }

    const anoFabNumerico = anoFab.trim() === "" ? null : Number(anoFab);

    if (
      anoFabNumerico !== null &&
      (!Number.isInteger(anoFabNumerico) ||
        anoNumerico - anoFabNumerico < 0 ||
        anoNumerico - anoFabNumerico > 1)
    ) {
      toast.aviso("O ano de fabricação deve ser igual ao ano modelo ou um ano antes dele (ex.: 2018/2019).");
      return;
    }

    onSave({
      clienteId: Number(clienteId),
      placa: placa.trim().toUpperCase(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      ano: anoNumerico,
      anoFabricacao: anoFabNumerico,
      uf,
      fipe,
    });
  }

  return (
    <Modal
      titulo={veiculo ? "Editar veículo" : "Novo veículo"}
      subtitulo="Informe os dados do veículo."
      larguraMax="max-w-lg"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Cliente
            </label>
            <SelectComBusca
              valor={clienteId}
              rotuloInicial={veiculo?.cliente?.nome ?? ""}
              placeholder="Busque o cliente por nome, CPF ou telefone"
              buscar={async (termo) =>
                (await clientesService.buscar(termo)).map((cliente) => ({
                  id: cliente.id,
                  rotulo: cliente.nome,
                }))
              }
              onChange={setClienteId}
            />
          </div>

          <FipeSeletor
            valor={fipe}
            onChange={(selecao, nomes) => {
              setFipe(selecao);
              if (nomes.marca !== undefined) setMarca(nomes.marca);
              if (nomes.modelo !== undefined) setModelo(nomes.modelo);
              if (nomes.ano !== undefined) setAno(String(nomes.ano));
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Marca
              </label>
              <input
                type="text"
                value={marca}
                onChange={(event) => setMarca(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Modelo
              </label>
              <input
                type="text"
                value={modelo}
                onChange={(event) => setModelo(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Placa
            </label>
            <input
              type="text"
              value={placa}
              onChange={(event) => setPlaca(limparPlaca(event.target.value))}
              maxLength={8}
              placeholder="ABC1D23 ou ABC1234"
              autoCapitalize="characters"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs font-semibold tracking-wider uppercase outline-none focus:border-blue-500"
              required
            />
            {placa && (
              <p
                className={`mt-1 text-[11px] ${
                  placaValida(placa) ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {placaValida(placa)
                  ? ROTULO_PADRAO[padraoDaPlaca(placa)!]
                  : "Use 3 letras e 4 números (ABC1234) ou o padrão Mercosul (ABC1D23)."}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Estado de emplacamento
            </label>
            <select
              value={uf}
              onChange={(event) => setUf(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-500"
            >
              <option value="">Selecione (para calcular IPVA e licenciamento)</option>
              {ESTADOS.map((sigla) => (
                <option key={sigla} value={sigla}>
                  {sigla}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Ano modelo
            </label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={ano}
              onChange={(event) => setAno(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Ano de fabricação (opcional)
            </label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={anoFab}
              placeholder="Ex.: 2018"
              onChange={(event) => setAnoFab(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Se for diferente do ano modelo, informe (como no documento: 2018/2019).
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
          >
            {veiculo ? "Salvar alterações" : "Criar veículo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
