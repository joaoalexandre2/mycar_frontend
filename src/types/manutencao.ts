export type TipoManutencao =
  | "preventiva"
  | "corretiva";

export type StatusManutencao =
  | "realizada"
  | "agendada";

export interface Manutencao {
  id: number;
  veiculoId: number;
  tipo: TipoManutencao;
  descricao: string;
  data: string;
  quilometragem: number;
  valor: number;
  proximaData?: string;
  proximaKm?: number;
  status: StatusManutencao;
}