import type { VeiculoConta } from "../types/conta";
import type { Veiculo } from "../types/veiculo";

/** Texto de um veículo nas listas de seleção: "Fiat Uno - ABC1D23 - Maria". */
export function rotuloVeiculo(veiculo: Veiculo): string {
  const base = `${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}`;

  return veiculo.cliente ? `${base} - ${veiculo.cliente.nome}` : base;
}

/** Nome de um veículo da conta: o apelido, ou "Marca Modelo". */
export function nomeDoVeiculoConta(veiculo: VeiculoConta): string {
  return veiculo.apelido?.trim() || `${veiculo.marca} ${veiculo.modelo}`;
}

/** Texto de um veículo da conta nas listas de seleção: "Carro da família · ABC1D23". */
export function rotuloVeiculoConta(veiculo: VeiculoConta): string {
  return `${nomeDoVeiculoConta(veiculo)} · ${veiculo.placa}`;
}
