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
  async listar() {
    const { data } = await api.get<OrdemApi[]>("/ordens-servico");
    return data.map(mapearOrdem);
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
