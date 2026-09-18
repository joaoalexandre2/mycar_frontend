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
  async listar() {
    const { data } = await api.get<ClienteApi[]>("/clientes");
    return data.map(mapearCliente);
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
