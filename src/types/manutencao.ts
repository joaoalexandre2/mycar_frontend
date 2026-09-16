import type { Veiculo } from "./veiculo";

export type StatusManutencao = "em_dia" | "proxima" | "atrasada";

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
}
