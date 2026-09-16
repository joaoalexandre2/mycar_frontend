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
  async listar() {
    const { data } = await api.get<ManutencaoApi[]>("/manutencoes");
    return data.map(mapearManutencao);
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
