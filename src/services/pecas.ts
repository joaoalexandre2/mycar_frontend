import api from "./api";

export type FontePeca = "ficha" | "servico";

export interface Peca {
  id: number;
  tipo: string;
  especificacao: string;
  marca: string | null;
  fonte: FontePeca;
  usado_em: string | null;
  observacao: string | null;
}

export interface PecasResposta {
  tipos: Record<string, string>;
  pecas: Peca[];
}

export interface NovaPeca {
  tipo: string;
  especificacao: string;
  marca: string | null;
  fonte: FontePeca;
  usado_em: string | null;
  observacao: string | null;
}

export const pecasService = {
  async listar(veiculoId: number): Promise<PecasResposta> {
    const { data } = await api.get<PecasResposta>(`/veiculos/${veiculoId}/pecas`);
    return data;
  },

  async registrar(veiculoId: number, peca: NovaPeca): Promise<Peca> {
    const { data } = await api.post<Peca>(`/veiculos/${veiculoId}/pecas`, peca);
    return data;
  },

  async remover(veiculoId: number, pecaId: number): Promise<void> {
    await api.delete(`/veiculos/${veiculoId}/pecas/${pecaId}`);
  },
};
