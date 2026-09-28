import api from "./api";
import type { Veiculo, VeiculoPayload } from "../types/veiculo";

interface VeiculoApi {
  id: number;
  cliente_id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number | string;
  cliente?: {
    id: number;
    nome: string;
    cpf?: string;
    telefone?: string;
  } | null;
}

export interface ResumoVeiculos {
  total: number;
  clientesComVeiculo: number;
  marcas: number;
  anoMedio: number;
}

interface RespostaPaginadaApi<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  resumo: ResumoVeiculos;
}

export interface ListarVeiculosParams {
  pagina?: number;
  busca?: string;
  porPagina?: number;
}

export interface PaginaVeiculos {
  dados: Veiculo[];
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  resumo: ResumoVeiculos;
}

export function mapearVeiculo(veiculo: VeiculoApi): Veiculo {
  return {
    id: veiculo.id,
    clienteId: veiculo.cliente_id,
    placa: veiculo.placa,
    marca: veiculo.marca,
    modelo: veiculo.modelo,
    ano: Number(veiculo.ano),
    cliente: veiculo.cliente
      ? {
          id: veiculo.cliente.id,
          nome: veiculo.cliente.nome,
          cpf: veiculo.cliente.cpf,
          telefone: veiculo.cliente.telefone,
        }
      : null,
  };
}

export const veiculosService = {
  /**
   * Retorna todos os veículos de uma vez (sem paginação).
   * Usado para preencher combos/selects em outras telas.
   */
  async listar() {
    const { data } = await api.get<VeiculoApi[]>("/veiculos", {
      params: { all: 1 },
    });
    return data.map(mapearVeiculo);
  },

  /**
   * Listagem paginada de verdade, usada pela tela de Veículos.
   */
  async listarPaginado(
    params: ListarVeiculosParams = {},
  ): Promise<PaginaVeiculos> {
    const { data } = await api.get<RespostaPaginadaApi<VeiculoApi>>(
      "/veiculos",
      {
        params: {
          page: params.pagina ?? 1,
          busca: params.busca || undefined,
          per_page: params.porPagina ?? 15,
        },
      },
    );

    return {
      dados: data.data.map(mapearVeiculo),
      paginaAtual: data.meta.current_page,
      totalPaginas: data.meta.last_page,
      totalRegistros: data.meta.total,
      resumo: data.resumo,
    };
  },

  async criar(payload: VeiculoPayload) {
    const { data } = await api.post<VeiculoApi>("/veiculos", payload);
    return mapearVeiculo(data);
  },

  async atualizar(id: number, payload: VeiculoPayload) {
    const { data } = await api.put<VeiculoApi>(`/veiculos/${id}`, payload);
    return mapearVeiculo(data);
  },

  async remover(id: number) {
    await api.delete(`/veiculos/${id}`);
  },
};
