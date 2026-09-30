import api from "./api";

export interface FipeItem {
  codigo: string;
  nome: string;
}

interface FipeModelosApi {
  modelos: { codigo: number | string; nome: string }[];
}

export const fipeService = {
  async marcas(): Promise<FipeItem[]> {
    const { data } = await api.get<FipeItem[]>("/fipe/marcas");
    return data;
  },

  async modelos(marcaId: string): Promise<FipeItem[]> {
    const { data } = await api.get<FipeModelosApi>(
      `/fipe/marcas/${marcaId}/modelos`,
    );
    return data.modelos.map((item) => ({
      codigo: String(item.codigo),
      nome: item.nome,
    }));
  },

  async anos(marcaId: string, modeloId: string): Promise<FipeItem[]> {
    const { data } = await api.get<FipeItem[]>(
      `/fipe/marcas/${marcaId}/modelos/${modeloId}/anos`,
    );
    return data;
  },
};

/**
 * "1989-1" -> 1989. Retorna null para códigos sem ano válido
 * (ex.: "32000-1", usado pela FIPE para zero km).
 */
export function anoDoCodigoFipe(codigo: string): number | null {
  const ano = Number.parseInt(codigo.split("-")[0], 10);

  if (Number.isNaN(ano) || ano < 1900 || ano > new Date().getFullYear()) {
    return null;
  }

  return ano;
}
