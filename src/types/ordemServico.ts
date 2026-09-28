import type { Veiculo } from "./veiculo";

export type StatusOrdemServico =
  | "aberta"
  | "em_andamento"
  | "aguardando_peca"
  | "finalizada"
  | "cancelada";

export interface OrdemServico {
  id: number;
  veiculoId: number;
  descricao: string;
  status: StatusOrdemServico;
  valor: number;
  dataAbertura: string;
  dataFechamento: string | null;
  veiculo?: Veiculo | null;
}

export interface OrdemServicoPayload {
  veiculo_id: number;
  descricao: string;
  status?: StatusOrdemServico;
  valor: number;
  data_abertura: string;
  data_fechamento?: string | null;
}
