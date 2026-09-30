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
  ano: number;
  uf: string | null;
  ipvaEstimado: number | null;
  licenciamentoValor: number | null;
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
  uf?: string | null;
  fipe_marca_id?: number | null;
  fipe_modelo_id?: number | null;
  fipe_ano?: string | null;
}
