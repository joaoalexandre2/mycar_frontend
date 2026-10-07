export type CategoriaSugestao = "melhoria" | "nova_funcao" | "problema" | "outro";

export type StatusSugestao =
  | "nova"
  | "em_analise"
  | "planejada"
  | "feita"
  | "recusada";

export interface Sugestao {
  id: number;
  categoria: CategoriaSugestao;
  titulo: string;
  descricao: string;
  status: StatusSugestao;
  /** Retorno da equipe para quem enviou. */
  resposta: string | null;
  criadaEm: string;
  /** Só na visão da equipe. */
  autor?: { nome: string | null; email: string | null; perfil: string | null };
}

export interface NovaSugestao {
  categoria: CategoriaSugestao;
  titulo: string;
  descricao: string;
}
