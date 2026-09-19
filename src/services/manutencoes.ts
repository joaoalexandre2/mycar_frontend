import api from "./api";
import type {
  Manutencao,
  ManutencaoPayload,
  StatusManutencao,
} from "../types/manutencao";
import { mapearVeiculo } from "./veiculos";
import { dataISO, hojeISO } from "../utils/formatters";

interface ManutencaoApi {
  id: number;
  veiculo_id: number;
  tipo: string;
  descricao: string | null;
  valor: number | string | null;
  data_manutencao: string;
  quilometragem: number | null;
  proxima_data: string | null;
  proxima_quilometragem: number | null;
  veiculo?: Parameters<typeof mapearVeiculo>[0] | null;
}

export interface ResumoManutencoes {
  total: number;
  emDia: number;
  proximas: number;
  atrasadas: number;
  veiculosMonitorados: number;
}

interface RespostaPaginadaApi<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  resumo: ResumoManutencoes;
}

export interface ListarManutencoesParams {
  pagina?: number;
  busca?: string;
  status?: "todos" | StatusManutencao;
  porPagina?: number;
}

export interface PaginaManutencoes {
  dados: Manutencao[];
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  resumo: ResumoManutencoes;
}

function statusPorData(proximaData: string | null): StatusManutencao {
  if (!proximaData) {
    return "em_dia";
  }

  const hoje = hojeISO();

  if (proximaData < hoje) {
    return "atrasada";
  }

  const limite = new Date(`${hoje}T00:00:00`);
  limite.setDate(limite.getDate() + 30);
  const limiteIso = limite.toISOString().slice(0, 10);

  if (proximaData <= limiteIso) {
    return "proxima";
  }

  return "em_dia";
}

export function mapearManutencao(item: ManutencaoApi): Manutencao {
  const proximaData = item.proxima_data
    ? dataISO(item.proxima_data)
    : null;

  return {
    id: item.id,
    veiculoId: item.veiculo_id,
    tipo: item.tipo,
    descricao: item.descricao ?? "",
    valor: item.valor === null ? null : Number(item.valor),
    dataManutencao: dataISO(item.data_manutencao),
    quilometragem: item.quilometragem,
    proximaData,
    proximaQuilometragem: item.proxima_quilometragem,
    status: statusPorData(proximaData),
    veiculo: item.veiculo ? mapearVeiculo(item.veiculo) : null,
  };
}

export const manutencoesService = {
  /**
   * Retorna todas as manutenções de uma vez (sem paginação).
   */
  async listar() {
    const { data } = await api.get<ManutencaoApi[]>("/manutencoes", {
      params: { all: 1 },
    });
    return data.map(mapearManutencao);
  },

  /**
   * Listagem paginada de verdade, usada pela tela de Manutenções.
   */
  async listarPaginado(
    params: ListarManutencoesParams = {},
  ): Promise<PaginaManutencoes> {
    const { data } = await api.get<RespostaPaginadaApi<ManutencaoApi>>(
      "/manutencoes",
      {
        params: {
          page: params.pagina ?? 1,
          busca: params.busca || undefined,
          status: params.status ?? "todos",
          per_page: params.porPagina ?? 15,
        },
      },
    );

    return {
      dados: data.data.map(mapearManutencao),
      paginaAtual: data.meta.current_page,
      totalPaginas: data.meta.last_page,
      totalRegistros: data.meta.total,
      resumo: data.resumo,
    };
  },

  async criar(payload: ManutencaoPayload) {
    const { data } = await api.post<ManutencaoApi>("/manutencoes", payload);
    return mapearManutencao(data);
  },

  async atualizar(id: number, payload: ManutencaoPayload) {
    const { data } = await api.put<ManutencaoApi>(
      `/manutencoes/${id}`,
      payload,
    );
    return mapearManutencao(data);
  },

  async remover(id: number) {
    await api.delete(`/manutencoes/${id}`);
  },
};
