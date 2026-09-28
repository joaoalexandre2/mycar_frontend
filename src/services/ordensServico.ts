import api from "./api";
import type {
  OrdemServico,
  OrdemServicoPayload,
  StatusOrdemServico,
} from "../types/ordemServico";
import { mapearVeiculo } from "./veiculos";
import { dataISO } from "../utils/formatters";

interface OrdemApi {
  id: number;
  veiculo_id: number;
  descricao: string;
  status: StatusOrdemServico;
  valor: number | string | null;
  data_abertura: string;
  data_fechamento: string | null;
  veiculo?: Parameters<typeof mapearVeiculo>[0] | null;
}

export interface ResumoOrdensServico {
  total: number;
  abertas: number;
  emAndamento: number;
  finalizadas: number;
  valorTotal: number;
}

interface RespostaPaginadaApi<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  resumo: ResumoOrdensServico;
}

export interface ListarOrdensServicoParams {
  pagina?: number;
  busca?: string;
  status?: "todos" | StatusOrdemServico;
  porPagina?: number;
}

export interface PaginaOrdensServico {
  dados: OrdemServico[];
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  resumo: ResumoOrdensServico;
}

export function mapearOrdem(ordem: OrdemApi): OrdemServico {
  return {
    id: ordem.id,
    veiculoId: ordem.veiculo_id,
    descricao: ordem.descricao,
    status: ordem.status,
    valor: Number(ordem.valor ?? 0),
    dataAbertura: dataISO(ordem.data_abertura),
    dataFechamento: ordem.data_fechamento
      ? dataISO(ordem.data_fechamento)
      : null,
    veiculo: ordem.veiculo ? mapearVeiculo(ordem.veiculo) : null,
  };
}

export const ordensServicoService = {
  /**
   * Retorna todas as ordens de uma vez (sem paginação).
   */
  async listar() {
    const { data } = await api.get<OrdemApi[]>("/ordens-servico", {
      params: { all: 1 },
    });
    return data.map(mapearOrdem);
  },

  /**
   * Listagem paginada de verdade, usada pela tela de Ordens de Serviço.
   */
  async listarPaginado(
    params: ListarOrdensServicoParams = {},
  ): Promise<PaginaOrdensServico> {
    const { data } = await api.get<RespostaPaginadaApi<OrdemApi>>(
      "/ordens-servico",
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
      dados: data.data.map(mapearOrdem),
      paginaAtual: data.meta.current_page,
      totalPaginas: data.meta.last_page,
      totalRegistros: data.meta.total,
      resumo: data.resumo,
    };
  },

  async buscar(id: number) {
    const { data } = await api.get<OrdemApi>(`/ordens-servico/${id}`);
    return mapearOrdem(data);
  },

  async criar(payload: OrdemServicoPayload) {
    const { data } = await api.post<OrdemApi>("/ordens-servico", payload);
    return mapearOrdem(data);
  },

  async atualizar(id: number, payload: OrdemServicoPayload) {
    const { data } = await api.put<OrdemApi>(
      `/ordens-servico/${id}`,
      payload,
    );
    return mapearOrdem(data);
  },

  async remover(id: number) {
    await api.delete(`/ordens-servico/${id}`);
  },
};
