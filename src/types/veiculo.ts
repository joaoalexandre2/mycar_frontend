export interface ClienteResumo {
  id: number;
  nome: string;
  cpf?: string;
  telefone?: string;
}

export interface Veiculo {
  id: number;
  clienteId: number;
  placa: string;
  marca: string;
  modelo: string;
  /** Ano do MODELO (o da tabela FIPE). */
  ano: number;
  /** Ano de fabricação, opcional (igual ao do modelo ou um antes). */
  anoFabricacao: number | null;
  /** Como no CRLV: "2018/2019", ou só "2018". */
  anoCompleto: string;
  /** Aviso: com 15+ anos de fabricação, alguns estados isentam o IPVA (confira na Sefaz). */
  possivelIsencaoIpva: boolean;
  uf: string | null;
  ipvaEstimado: number | null;
  licenciamentoValor: number | null;
  proximoVencimentoLicenciamento: string | null;
  fipeMarcaId: number | null;
  fipeModeloId: number | null;
  fipeAno: string | null;
  fipeValor: number | null;
  fipeConsultadoEm: string | null;
  cliente?: ClienteResumo | null;
}

export interface VeiculoPayload {
  cliente_id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  ano_fabricacao?: number | null;
  uf?: string | null;
  fipe_marca_id?: number | null;
  fipe_modelo_id?: number | null;
  fipe_ano?: string | null;
}
