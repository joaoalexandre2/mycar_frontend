import api from "./api";
import { dataISO } from "../utils/formatters";
import type {
  CategoriaSugestao,
  NovaSugestao,
  StatusSugestao,
  Sugestao,
} from "../types/sugestoes";

interface SugestaoApi {
  id: number;
  categoria: CategoriaSugestao;
  titulo: string;
  descricao: string;
  status: StatusSugestao;
  resposta: string | null;
  criada_em: string;
  autor?: { nome: string | null; email: string | null; perfil: string | null };
}

export function mapearSugestao(item: SugestaoApi): Sugestao {
  return {
    id: item.id,
    categoria: item.categoria,
    titulo: item.titulo,
    descricao: item.descricao,
    status: item.status,
    resposta: item.resposta,
    criadaEm: dataISO(item.criada_em),
    autor: item.autor,
  };
}

export const sugestaoService = {
  async minhas(): Promise<Sugestao[]> {
    const { data } = await api.get<SugestaoApi[]>("/sugestoes");
    return data.map(mapearSugestao);
  },

  async enviar(sugestao: NovaSugestao): Promise<Sugestao> {
    const { data } = await api.post<SugestaoApi>("/sugestoes", sugestao);
    return mapearSugestao(data);
  },

  /** Equipe: todas as sugestões (só o operador da plataforma consegue). */
  async todas(status?: StatusSugestao): Promise<Sugestao[]> {
    const { data } = await api.get<SugestaoApi[]>("/admin/sugestoes", {
      params: { status: status || undefined },
    });
    return data.map(mapearSugestao);
  },

  async responder(
    id: number,
    status: StatusSugestao,
    resposta: string | null,
  ): Promise<Sugestao> {
    const { data } = await api.put<SugestaoApi>(`/admin/sugestoes/${id}`, {
      status,
      resposta,
    });
    return mapearSugestao(data);
  },
};
