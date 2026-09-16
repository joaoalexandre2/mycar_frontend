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
  async listar() {
    const { data } = await api.get<VeiculoApi[]>("/veiculos");
    return data.map(mapearVeiculo);
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
