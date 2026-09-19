import api from "./api";
import type { Cliente, ClientePayload } from "../types/cliente";
import { dataISO } from "../utils/formatters";

interface ClienteApi {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  ativo: boolean | number;
  veiculos_count?: number;
  veiculos?: unknown[];
  created_at?: string;
}

export interface ResumoClientes {
  total: number;
  ativos: number;
  inativos: number;
  totalVeiculos: number;
}

interface RespostaPaginadaApi<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  resumo: ResumoClientes;
}

export interface ListarClientesParams {
  pagina?: number;
  busca?: string;
  status?: "todos" | "ativos" | "inativos";
  porPagina?: number;
}

export interface PaginaClientes {
  dados: Cliente[];
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  resumo: ResumoClientes;
}

function mapearCliente(cliente: ClienteApi): Cliente {
  return {
    id: cliente.id,
    nome: cliente.nome,
    cpf: cliente.cpf,
    telefone: cliente.telefone,
    ativo: Boolean(cliente.ativo),
    quantidadeVeiculos:
      cliente.veiculos_count ?? cliente.veiculos?.length ?? 0,
    dataCadastro: dataISO(cliente.created_at) || hojeCadastro(),
  };
}

function hojeCadastro() {
  return new Date().toISOString().slice(0, 10);
}

export const clientesService = {
  /**
   * Retorna todos os clientes de uma vez (sem paginação).
   * Usado para preencher combos/selects em outras telas.
   */
  async listar() {
    const { data } = await api.get<ClienteApi[]>("/clientes", {
      params: { all: 1 },
    });
    return data.map(mapearCliente);
  },

  /**
   * Listagem paginada de verdade, usada pela tela de Clientes.
   */
  async listarPaginado(
    params: ListarClientesParams = {},
  ): Promise<PaginaClientes> {
    const { data } = await api.get<RespostaPaginadaApi<ClienteApi>>(
      "/clientes",
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
      dados: data.data.map(mapearCliente),
      paginaAtual: data.meta.current_page,
      totalPaginas: data.meta.last_page,
      totalRegistros: data.meta.total,
      resumo: data.resumo,
    };
  },

  async criar(payload: ClientePayload) {
    const { data } = await api.post<ClienteApi>("/clientes", payload);
    return mapearCliente(data);
  },

  async atualizar(id: number, payload: ClientePayload) {
    const { data } = await api.put<ClienteApi>(`/clientes/${id}`, payload);
    return mapearCliente(data);
  },

  async remover(id: number) {
    await api.delete(`/clientes/${id}`);
  },
};
