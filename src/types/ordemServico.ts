export type StatusOrdemServico =
  | "aberta"
  | "em_andamento"
  | "concluida"
  | "cancelada";

export interface OrdemServico {
  id: number;
  veiculoId: number;
  descricao: string;
  status: StatusOrdemServico;
  valor: number;
  dataAbertura: string;
}