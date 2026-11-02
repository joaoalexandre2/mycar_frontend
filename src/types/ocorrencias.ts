export const TIPOS_DE_OCORRENCIA = {
  acidente: "Acidente",
  avaria: "Avaria",
  dano: "Dano na carroceria",
  mecanico: "Problema mecânico",
  uso: "Problema durante o uso",
} as const;

export type TipoDeOcorrencia = keyof typeof TIPOS_DE_OCORRENCIA;

export const STATUS_DE_OCORRENCIA = {
  aberta: "Aberta",
  em_analise: "Em análise",
  aguardando_orcamento: "Aguardando orçamento",
  em_reparo: "Em reparo",
  concluida: "Concluída",
  cancelada: "Cancelada",
} as const;

export type StatusDeOcorrencia = keyof typeof STATUS_DE_OCORRENCIA;

export interface FotoDeOcorrencia {
  id: number;
  momento: "antes" | "depois";
  url: string;
}

export interface Ocorrencia {
  id: number;
  tipo: TipoDeOcorrencia;
  tipoRotulo: string;
  status: StatusDeOcorrencia;
  statusRotulo: string;
  /** Data e hora com o fuso de Brasília (ex.: 2026-11-10T08:00:00-03:00). */
  dataHora: string;
  local: string | null;
  descricao: string;
  veiculo: { id: number; placa: string } | null;
  motorista: { id: number; nome: string } | null;
  fotos: FotoDeOcorrencia[];
  /** Só aparecem para quem gerencia a frota. */
  prejuizoEstimado: number | null;
  valorGasto: number | null;
  despesaId: number | null;
}

export interface ResumoDeOcorrencias {
  total: number;
  abertas: number;
  porStatus: Record<StatusDeOcorrencia, number>;
  /** Só para quem gerencia a frota. */
  prejuizoTotal: number | null;
  gastoTotal: number | null;
}

export interface FiltroDeOcorrencias {
  tipo?: TipoDeOcorrencia;
  status?: StatusDeOcorrencia;
  veiculoId?: number;
}

export interface OcorrenciaPayload {
  veiculoId: number;
  tipo: TipoDeOcorrencia;
  /** Horário digitado, em Brasília (AAAA-MM-DDTHH:mm). */
  dataHora: string;
  local: string | null;
  descricao: string;
  prejuizoEstimado?: number | null;
  valorGasto?: number | null;
  status?: StatusDeOcorrencia;
}
