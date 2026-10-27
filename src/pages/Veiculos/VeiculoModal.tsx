import { useId, useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { useEnvio } from "../../hooks/useEnvio";
import { useErrosDeCampo } from "../../hooks/useErrosDeCampo";
import { ErroDoCampo } from "../../components/ui/ErroDoCampo";

import { clientesService } from "../../services/clientes";
import { SelectComBusca } from "../../components/ui/SelectComBusca";
import type { TipoVeiculo, Veiculo } from "../../types/veiculo";
import { SeletorDeTipo } from "../../components/veiculos/SeletorDeTipo";
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
  tipo: TipoVeiculo;
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
  onSave: (veiculo: DadosVeiculoForm) => void | Promise<void>;
}) {
  const { enviando, enviar } = useEnvio();
  const { erros, mostrar, limpar, atributos } = useErrosDeCampo();
  const idCliente = useId();
  const idMarca = useId();
  const idModelo = useId();
  const idPlaca = useId();
  const idAjudaPlaca = useId();
  const idUf = useId();
  const idAno = useId();
  const idAnoFab = useId();
  const idAjudaAnoFab = useId();
  const [clienteId, setClienteId] = useState(
    veiculo?.clienteId?.toString() ?? "",
  );
  const [tipo, setTipo] = useState<TipoVeiculo>(veiculo?.tipoVeiculo ?? "carro");
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

    const novos: Record<string, string> = {};

    if (!clienteId) novos[idCliente] = "Escolha o cliente.";
    if (!marca.trim()) novos[idMarca] = "Informe a marca.";
    if (!modelo.trim()) novos[idModelo] = "Informe o modelo.";

    if (!placa.trim()) {
      novos[idPlaca] = "Informe a placa.";
    } else if (!placaValida(placa)) {
      novos[idPlaca] =
        "Placa inválida. Use o padrão antigo (ABC1234) ou o Mercosul (ABC1D23).";
    }

    if (
      Number.isNaN(anoNumerico) ||
      anoNumerico < 1900 ||
      anoNumerico > anoMaximo
    ) {
      novos[idAno] = `Informe o ano modelo, entre 1900 e ${anoMaximo}.`;
    }

    const anoFabNumerico = anoFab.trim() === "" ? null : Number(anoFab);

    if (
      anoFabNumerico !== null &&
      (!Number.isInteger(anoFabNumerico) ||
        anoNumerico - anoFabNumerico < 0 ||
        anoNumerico - anoFabNumerico > 1)
    ) {
      novos[idAnoFab] =
        "O ano de fabricação deve ser igual ao ano modelo ou um ano antes dele (ex.: 2018/2019).";
    }

    if (Object.keys(novos).length > 0) {
      mostrar(novos, [
        idCliente,
        idMarca,
        idModelo,
        idPlaca,
        idAno,
        idAnoFab,
      ]);
      return;
    }

    void enviar(() =>
      onSave({
        clienteId: Number(clienteId),
        tipo,
        placa: placa.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: anoNumerico,
        anoFabricacao: anoFabNumerico,
        uf,
        fipe,
      }),
    );
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
            <span className="mb-1.5 block text-xs font-medium text-gray-700">
              Cliente
            </span>
            <SelectComBusca
              id={idCliente}
              invalido={Boolean(erros[idCliente])}
              descritoPor={atributos(idCliente)["aria-describedby"]}
              rotulo="Cliente"
              valor={clienteId}
              rotuloInicial={veiculo?.cliente?.nome ?? ""}
              placeholder="Busque o cliente por nome, CPF ou telefone"
              buscar={async (termo) =>
                (await clientesService.buscar(termo)).map((cliente) => ({
                  id: cliente.id,
                  rotulo: cliente.nome,
                }))
              }
              onChange={(novo) => {
                setClienteId(novo);
                limpar(idCliente);
              }}
            />
            <ErroDoCampo campo={idCliente} mensagem={erros[idCliente]} />
          </div>

          <SeletorDeTipo
            valor={tipo}
            onChange={(novo) => {
              // Os códigos da FIPE de um tipo não servem para outro.
              setTipo(novo);
              setFipe({ marcaId: "", modeloId: "", ano: "" });
            }}
          />

          <FipeSeletor
            key={tipo}
            tipo={tipo}
            valor={fipe}
            onChange={(selecao, nomes) => {
              setFipe(selecao);
              if (nomes.marca !== undefined) {
  setMarca(nomes.marca);
  limpar(idMarca);
}
              if (nomes.modelo !== undefined) {
  setModelo(nomes.modelo);
  limpar(idModelo);
}
              if (nomes.ano !== undefined) {
  setAno(String(nomes.ano));
  limpar(idAno);
}
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={idMarca}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Marca
              </label>
              <input
                id={idMarca}
                {...atributos(idMarca)}
                type="text"
                value={marca}
                onChange={(event) => {
                  setMarca(event.target.value);
                  limpar(idMarca);
                }}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500 aria-invalid:border-red-500"
                required
              />
              <ErroDoCampo campo={idMarca} mensagem={erros[idMarca]} />
            </div>
            <div>
              <label
                htmlFor={idModelo}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Modelo
              </label>
              <input
                id={idModelo}
                {...atributos(idModelo)}
                type="text"
                value={modelo}
                onChange={(event) => {
                  setModelo(event.target.value);
                  limpar(idModelo);
                }}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500 aria-invalid:border-red-500"
                required
              />
              <ErroDoCampo campo={idModelo} mensagem={erros[idModelo]} />
            </div>
          </div>

          <div>
            <label
              htmlFor={idPlaca}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Placa
            </label>
            <input
              id={idPlaca}
              {...atributos(idPlaca, placa ? idAjudaPlaca : undefined)}
              type="text"
              value={placa}
              onChange={(event) => {
                setPlaca(limparPlaca(event.target.value));
                limpar(idPlaca);
              }}
              maxLength={8}
              placeholder="ABC1D23 ou ABC1234"
              autoCapitalize="characters"
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs font-semibold tracking-wider uppercase outline-none focus:border-blue-500 aria-invalid:border-red-500"
              required
            />
            <ErroDoCampo campo={idPlaca} mensagem={erros[idPlaca]} />
            {placa && (
              <p
                id={idAjudaPlaca}
                className={`mt-1 text-xs ${
                  placaValida(placa) ? "text-emerald-700" : "text-gray-500"
                }`}
              >
                {placaValida(placa)
                  ? ROTULO_PADRAO[padraoDaPlaca(placa)!]
                  : "Use 3 letras e 4 números (ABC1234) ou o padrão Mercosul (ABC1D23)."}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={idUf}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Estado de emplacamento
            </label>
            <select
              id={idUf}
              value={uf}
              onChange={(event) => setUf(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-500 aria-invalid:border-red-500"
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
            <label
              htmlFor={idAno}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Ano modelo
            </label>
            <input
              id={idAno}
              {...atributos(idAno)}
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={ano}
              onChange={(event) => {
                setAno(event.target.value);
                limpar(idAno);
              }}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500 aria-invalid:border-red-500"
              required
            />
            <ErroDoCampo campo={idAno} mensagem={erros[idAno]} />
          </div>

          <div>
            <label
              htmlFor={idAnoFab}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Ano de fabricação (opcional)
            </label>
            <input
              id={idAnoFab}
              {...atributos(idAnoFab, idAjudaAnoFab)}
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={anoFab}
              placeholder="Ex.: 2018"
              onChange={(event) => {
                setAnoFab(event.target.value);
                limpar(idAnoFab);
              }}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500 aria-invalid:border-red-500"
            />
            <ErroDoCampo campo={idAnoFab} mensagem={erros[idAnoFab]} />
            <p id={idAjudaAnoFab} className="mt-1 text-xs text-gray-500">
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
            disabled={enviando}
            className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "Salvando..."
              : veiculo
                ? "Salvar alterações"
                : "Criar veículo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
