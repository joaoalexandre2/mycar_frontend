import api from "./api";
import type { TipoVeiculo } from "../types/veiculo";
import { tipoDaFipe } from "../utils/tipoVeiculo";

export interface FipeItem {
  codigo: string;
  nome: string;
}

interface FipeModelosApi {
  modelos: { codigo: number | string; nome: string }[];
}

/**
 * Qual tabela da FIPE consultar. Carro é o padrão do servidor: só moto e
 * caminhão levam o tipo na consulta.
 */
function opcoes(tipo: TipoVeiculo) {
  return tipo === "carro" ? undefined : { params: { tipo: tipoDaFipe(tipo) } };
}

export const fipeService = {
  async marcas(tipo: TipoVeiculo = "carro"): Promise<FipeItem[]> {
    const { data } = await api.get<FipeItem[]>("/fipe/marcas", opcoes(tipo));
    return data;
  },

  async modelos(marcaId: string, tipo: TipoVeiculo = "carro"): Promise<FipeItem[]> {
    const { data } = await api.get<FipeModelosApi>(
      `/fipe/marcas/${marcaId}/modelos`,
      opcoes(tipo),
    );
    return data.modelos.map((item) => ({
      codigo: String(item.codigo),
      nome: item.nome,
    }));
  },

  /** Anos da marca, já com o combustível ("2014 Flex"), para escolher o ano antes do modelo. */
  async anosDaMarca(marcaId: string, tipo: TipoVeiculo = "carro"): Promise<FipeItem[]> {
    const { data } = await api.get<FipeItem[]>(`/fipe/marcas/${marcaId}/anos`, opcoes(tipo));
    return data;
  },

  /** Só os modelos da marca que existem naquele ano (código "2014-5"). */
  async modelosDoAno(marcaId: string, ano: string, tipo: TipoVeiculo = "carro"): Promise<FipeItem[]> {
    const { data } = await api.get<FipeItem[]>(
      `/fipe/marcas/${marcaId}/anos/${ano}/modelos`,
      opcoes(tipo),
    );
    return data;
  },

  async anos(marcaId: string, modeloId: string, tipo: TipoVeiculo = "carro"): Promise<FipeItem[]> {
    const { data } = await api.get<FipeItem[]>(
      `/fipe/marcas/${marcaId}/modelos/${modeloId}/anos`,
      opcoes(tipo),
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
