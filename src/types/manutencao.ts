import type { Veiculo } from "./veiculo";

export type StatusManutencao = "em_dia" | "proxima" | "atrasada";

/** Peça usada em um serviço, registrada junto com a manutenção. */
export interface PecaManutencao {
  tipo: string;
  especificacao: string;
  marca: string | null;
}

export interface Manutencao {
  id: number;
  veiculoId: number;
  tipo: string;
  descricao: string;
  valor: number | null;
  dataManutencao: string;
  quilometragem: number | null;
  proximaData: string | null;
  proximaQuilometragem: number | null;
  status: StatusManutencao;
  pecas: PecaManutencao[];
  veiculo?: Veiculo | null;
}

export interface ManutencaoPayload {
  veiculo_id: number;
  tipo: string;
  descricao: string;
  valor?: number | null;
  data_manutencao: string;
  quilometragem?: number | null;
  proxima_data?: string | null;
  proxima_quilometragem?: number | null;
  /** Ausente = não altera as peças já registradas; [] = remove; lista = substitui. */
  pecas?: PecaManutencao[];
}
