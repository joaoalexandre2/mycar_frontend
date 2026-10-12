import type { Veiculo } from "../types/veiculo";

/** Texto de um veículo nas listas de seleção: "Fiat Uno - ABC1D23 - Maria". */
export function rotuloVeiculo(veiculo: Veiculo): string {
  const base = `${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}`;

  return veiculo.cliente ? `${base} - ${veiculo.cliente.nome}` : base;
}
