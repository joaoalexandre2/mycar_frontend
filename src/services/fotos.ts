import api from "./api";
import { dataISO } from "../utils/formatters";
import { urlDaFoto } from "../utils/imagem";

export interface FotoVeiculo {
  id: number;
  legenda: string | null;
  criadaEm: string;
  /** Links temporários (valem por algumas horas): recarregue o álbum para renovar. */
  url: string;
  urlMiniatura: string;
}

export interface AlbumDoVeiculo {
  limite: number;
  fotos: FotoVeiculo[];
}

interface AlbumApi {
  limite: number;
  fotos: {
    id: number;
    legenda: string | null;
    criada_em: string;
    url: string;
    url_miniatura: string;
  }[];
}

export function mapearAlbum(resposta: AlbumApi): AlbumDoVeiculo {
  return {
    limite: resposta.limite,
    fotos: resposta.fotos.map((f) => ({
      id: f.id,
      legenda: f.legenda,
      criadaEm: dataISO(f.criada_em),
      url: urlDaFoto(f.url),
      urlMiniatura: urlDaFoto(f.url_miniatura),
    })),
  };
}

export const fotosVeiculoService = {
  async listar(veiculoId: number): Promise<AlbumDoVeiculo> {
    const { data } = await api.get<AlbumApi>(`/conta/veiculos/${veiculoId}/fotos`);
    return mapearAlbum(data);
  },

  /** Envia a foto reduzida e a miniatura (o servidor só confere e guarda). */
  async enviar(veiculoId: number, foto: Blob, miniatura: Blob, legenda?: string): Promise<AlbumDoVeiculo> {
    const corpo = new FormData();
    corpo.append("foto", foto, "foto.jpg");
    corpo.append("miniatura", miniatura, "miniatura.jpg");
    if (legenda) corpo.append("legenda", legenda);

    const { data } = await api.post<AlbumApi>(`/conta/veiculos/${veiculoId}/fotos`, corpo);
    return mapearAlbum(data);
  },

  async remover(veiculoId: number, fotoId: number): Promise<AlbumDoVeiculo> {
    const { data } = await api.delete<AlbumApi>(`/conta/veiculos/${veiculoId}/fotos/${fotoId}`);
    return mapearAlbum(data);
  },
};
