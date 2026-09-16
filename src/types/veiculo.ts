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
  cliente?: ClienteResumo | null;
}

export interface VeiculoPayload {
  cliente_id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
}
