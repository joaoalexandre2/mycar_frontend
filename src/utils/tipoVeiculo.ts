import type { TipoVeiculo } from "../types/veiculo";

/** Os tipos de veículo aceitos, na ordem em que aparecem para escolher. */
export const TIPOS_DE_VEICULO: { valor: TipoVeiculo; rotulo: string }[] = [
  { valor: "carro", rotulo: "Carro" },
  { valor: "moto", rotulo: "Moto" },
  { valor: "caminhao", rotulo: "Caminhão" },
];

export const ROTULO_TIPO: Record<TipoVeiculo, string> = {
  carro: "Carro",
  moto: "Moto",
  caminhao: "Caminhão",
};

export function ehTipoVeiculo(valor: unknown): valor is TipoVeiculo {
  return valor === "carro" || valor === "moto" || valor === "caminhao";
}

/** Dados antigos ou ausentes são carro. */
export function tipoDe(valor: unknown): TipoVeiculo {
  return ehTipoVeiculo(valor) ? valor : "carro";
}

/** Nome do tipo na tabela FIPE. */
export function tipoDaFipe(tipo: TipoVeiculo): "carros" | "motos" | "caminhoes" {
  return tipo === "moto" ? "motos" : tipo === "caminhao" ? "caminhoes" : "carros";
}

/**
 * As estimativas de IPVA e licenciamento, a ficha técnica do catálogo e a faixa
 * de seguro são só de carros: não há alíquotas nem fichas de motos e caminhões.
 */
export function temEstimativas(tipo: TipoVeiculo): boolean {
  return tipo === "carro";
}
