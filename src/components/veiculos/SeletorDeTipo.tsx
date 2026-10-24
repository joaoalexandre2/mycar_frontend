import { TIPOS_DE_VEICULO } from "../../utils/tipoVeiculo";
import type { TipoVeiculo } from "../../types/veiculo";

/**
 * Escolha entre carro, moto e caminhão. Define a tabela da FIPE que o seletor
 * abaixo consulta: trocar o tipo limpa a escolha da FIPE (os códigos de um tipo
 * não servem para outro).
 */
export function SeletorDeTipo({
  valor,
  onChange,
}: {
  valor: TipoVeiculo;
  onChange: (tipo: TipoVeiculo) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-medium text-gray-700">Tipo do veículo</legend>

      <div className="grid grid-cols-3 gap-2">
        {TIPOS_DE_VEICULO.map((tipo) => (
          <label
            key={tipo.valor}
            className={`flex h-10 cursor-pointer items-center justify-center rounded-lg border text-xs font-semibold transition ${
              valor === tipo.valor
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="tipo-do-veiculo"
              value={tipo.valor}
              checked={valor === tipo.valor}
              onChange={() => onChange(tipo.valor)}
              className="sr-only"
            />
            {tipo.rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
