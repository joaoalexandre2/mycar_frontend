import type { Perfil, Usuario } from "../types/auth";

export interface InfoPerfil {
  /** Nome do produto, como aparece no cadastro e no menu. */
  produto: string;
  /** Frase curta para quem está escolhendo. */
  descricao: string;
}

export const PERFIS: Record<Perfil, InfoPerfil> = {
  oficina: {
    produto: "MyCar Oficina",
    descricao:
      "Gerencie clientes, ordens de serviço, manutenções e o histórico dos carros que passam pela sua oficina.",
  },
  pessoa: {
    produto: "MyCar Cuidados com seu carro",
    descricao:
      "Acompanhe o valor, o IPVA, o licenciamento e a revisão do seu carro, sem esquecer nenhuma data.",
  },
  frota: {
    produto: "MyCar Frota",
    descricao:
      "Controle os veículos da sua empresa em um só lugar: valores, vencimentos e manutenção.",
  },
  estetica: {
    produto: "MyCar Estética Automotiva",
    descricao:
      "Organize o pátio do seu lava-rápido ou estética: fotos de entrada e entrega, serviços e o histórico de cada carro pela placa.",
  },
};

/** Nome curto de cada produto, para espaços apertados (menu lateral). */
export const NOME_CURTO_PERFIL: Record<Perfil, string> = {
  oficina: "Oficina",
  pessoa: "Cuidados com seu carro",
  frota: "Frota",
  estetica: "Estética",
};

export const ORDEM_PERFIS: Perfil[] = ["pessoa", "oficina", "frota", "estetica"];

export function ehPerfil(valor: string | null | undefined): valor is Perfil {
  return valor === "oficina" || valor === "pessoa" || valor === "frota" || valor === "estetica";
}

/** Sessões salvas antes dos perfis existirem não têm o campo: são de oficina. */
export function perfilDe(usuario: Usuario | null | undefined): Perfil {
  return usuario?.perfil ?? "oficina";
}

/** Pessoa e frota usam a mesma base de veículos da própria conta. */
export function ehConta(perfil: Perfil): boolean {
  return perfil === "pessoa" || perfil === "frota" || perfil === "estetica";
}
