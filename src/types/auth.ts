/** Os três produtos do MyCar. Sessões antigas, sem perfil, são de oficina. */
export type Perfil = "oficina" | "pessoa" | "frota";

export interface Usuario {
  id: number;
  name: string;
  email: string;
  perfil?: Perfil;
  oficina?: string | null;
  /** Nome da conta, nos perfis pessoa e frota. */
  conta?: string | null;
  /** Operador da plataforma. Só mostra/esconde o menu: o backend é quem barra. */
  admin?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  /** Sem o campo, o backend entende "oficina". */
  perfil?: Perfil;
  nome_oficina?: string;
  nome_frota?: string;
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}
