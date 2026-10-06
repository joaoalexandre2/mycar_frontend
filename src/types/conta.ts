/** Veículo de uma conta (perfis pessoa e frota). */
export interface VeiculoConta {
  id: number;
  apelido: string | null;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  uf: string | null;
  ipvaEstimado: number | null;
  licenciamentoValor: number | null;
  proximoVencimentoIpva: string | null;
  proximoVencimentoLicenciamento: string | null;
  /** Próxima revisão, informada pelo dono. */
  revisaoPrevistaEm: string | null;
  fipeMarcaId: number | null;
  fipeModeloId: number | null;
  fipeAno: string | null;
  fipeValor: number | null;
  fipeConsultadoEm: string | null;
}

export interface VeiculoContaPayload {
  apelido?: string | null;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  uf?: string | null;
  revisao_prevista_em?: string | null;
  fipe_marca_id?: number | null;
  fipe_modelo_id?: number | null;
  fipe_ano?: string | null;
}

export type TipoVencimento = "ipva" | "licenciamento" | "revisao";

export interface PreferenciasConta {
  nome: string | null;
  tipo: "pessoa" | "frota" | null;
  lembretesEmail: boolean;
}

export interface Vencimento {
  tipo: TipoVencimento;
  veiculoId: number;
  veiculo: string;
  placa: string;
  data: string;
  dias: number;
  valorEstimado: number | null;
}

export interface ResumoConta {
  nomeConta: string | null;
  tipoConta: "pessoa" | "frota" | null;
  totalVeiculos: number;
  valorTotalFipe: number;
  vencimentos: Vencimento[];
  diasAFrente: number;
}
