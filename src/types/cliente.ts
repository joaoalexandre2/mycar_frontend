export interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string | null;
  ativo: boolean;
  quantidadeVeiculos: number;
  dataCadastro: string;
}

export interface ClientePayload {
  nome: string;
  cpf: string;
  telefone: string;
  email?: string | null;
  ativo: boolean;
}
