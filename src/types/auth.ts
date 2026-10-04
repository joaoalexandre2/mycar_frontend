export interface Usuario {
  id: number;
  name: string;
  email: string;
  oficina?: string | null;
  /** Operador da plataforma. Só mostra/esconde o menu: o backend é quem barra. */
  admin?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nome_oficina: string;
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}
