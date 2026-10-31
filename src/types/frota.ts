/** Centro de custos da frota (ex.: Vendas, Entregas). */
export interface CentroCusto {
  id: number;
  nome: string;
  codigo: string | null;
  ativo: boolean;
}

/** Motivo cadastrado pela frota para trocar o centro de custo de um uso. */
export interface MotivoTrocaCentro {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface CentroCustoPayload {
  nome: string;
  codigo?: string | null;
  ativo?: boolean;
}

/** Uma troca de centro de custo de um uso, com os nomes de quando ela aconteceu. */
export interface TrocaDeCentro {
  id: number;
  usoId: number | null;
  veiculoId: number | null;
  de: { id: number | null; nome: string | null };
  para: { id: number | null; nome: string | null };
  usuario: string | null;
  motivo: string | null;
  em: string;
}

export interface FiltroTrocasDeCentro {
  de?: string;
  ate?: string;
  centroCustoId?: number;
}

export interface UsuarioDaFrota {
  id: number;
  name: string;
  email: string;
}

/** Grupo de usuários da frota: reúne pessoas e concede permissões além do papel. */
export interface GrupoUsuario {
  id: number;
  nome: string;
  descricao: string | null;
  permissoes: string[];
  /** Menus que o grupo libera a quem pertence a ele. */
  menus_liberados: string[];
  membros: UsuarioDaFrota[];
}

export interface GrupoUsuarioPayload {
  nome: string;
  descricao?: string | null;
  permissoes: string[];
  menus_liberados: string[];
  membros: number[];
}

export interface GruposDaFrota {
  grupos: GrupoUsuario[];
  /** chave => descrição, vinda do servidor. */
  catalogo: Record<string, string>;
  /** menu => descrição, vinda do servidor. */
  menus: Record<string, string>;
  usuarios: UsuarioDaFrota[];
}

/** Motorista da frota: só cadastro, ou com login quando o convite existir. */
export interface Motorista {
  id: number;
  nome: string;
  telefone: string | null;
  cnhNumero: string | null;
  cnhValidade: string | null;
  ativo: boolean;
  /** Centro de custo a que o motorista está amarrado; as reservas dele saem nele. */
  centroCustoId: number | null;
}

export interface MotoristaPayload {
  nome: string;
  telefone?: string | null;
  cnh_numero?: string | null;
  cnh_validade?: string | null;
  ativo?: boolean;
  centro_custo_id?: number | null;
}

/** agendado → em_uso (saída) → concluido (chegada); cancelado sai da agenda. */
export type StatusUso = "agendado" | "em_uso" | "concluido" | "cancelado";

export const ROTULO_STATUS_USO: Record<StatusUso, string> = {
  agendado: "Agendado",
  em_uso: "Em uso",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

/** Uso de um veículo da frota: a reserva, a saída e a chegada com o km do hodômetro. */
export interface UsoVeiculo {
  id: number;
  veiculoId: number;
  veiculo: { id: number; nome: string; placa: string; kmAtual: number | null } | null;
  motoristaId: number | null;
  motorista: string | null;
  centroCustoId: number | null;
  centroCusto: string | null;
  /** Data e hora locais ("2026-11-10T08:00"), prontas para exibir e para o campo datetime-local. */
  inicioPrevisto: string;
  fimPrevisto: string;
  finalidade: string | null;
  status: StatusUso;
  kmSaida: number | null;
  kmChegada: number | null;
  kmRodados: number | null;
  saidaEm: string | null;
  chegadaEm: string | null;
  /** Links temporários das fotos do hodômetro (nulos sem foto). */
  urlFotoSaida: string | null;
  urlFotoChegada: string | null;
  origem: "agenda" | "planilha";
  observacoes: string | null;
}

export interface UsoPayload {
  veiculo_conta_id: number;
  motorista_id?: number | null;
  centro_custo_id?: number | null;
  inicio_previsto: string;
  fim_previsto: string;
  finalidade?: string | null;
  observacoes?: string | null;
}

export interface FiltroAgenda {
  de: string;
  ate: string;
  veiculoId?: number;
  motoristaId?: number;
}

/** Resumo devolvido pela importação da planilha de utilização. */
export interface ResumoImportacao {
  usos: number;
  veiculos: number;
  kmRodados: number;
  motoristasNovos: string[];
  centrosNovos: string[];
  /** false na simulação: nada foi gravado. */
  gravado: boolean;
}

/** Problemas da planilha: nada é importado enquanto houver algum. */
export interface ErrosDeImportacao {
  mensagem: string;
  erros: string[];
  totalDeErros: number;
}

/** Pessoa da frota e seu papel (administrador, gestor ou motorista). */
export type PapelDaFrota = "administrador" | "gestor" | "motorista";

export interface PessoaDaFrota {
  id: number;
  name: string;
  email: string;
  papel: PapelDaFrota;
}
