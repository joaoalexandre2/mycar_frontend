import api from "./api";
import { mapearVeiculo } from "./veiculos";
import { mapearOrdem } from "./ordensServico";
import { mapearManutencao } from "./manutencoes";
import type { Veiculo } from "../types/veiculo";
import type { OrdemServico } from "../types/ordemServico";
import type { Manutencao } from "../types/manutencao";

export interface FipeHistoricoItem {
  valor: number;
  consultadoEm: string;
}

export interface HistoricoVeiculo {
  veiculo: Veiculo;
  ordensServico: OrdemServico[];
  manutencoes: Manutencao[];
  fipeHistorico: FipeHistoricoItem[];
}

interface HistoricoApi {
  veiculo: Parameters<typeof mapearVeiculo>[0];
  ordens_servico: Parameters<typeof mapearOrdem>[0][];
  manutencoes: Parameters<typeof mapearManutencao>[0][];
  fipe_historico: { valor: string | number; consultado_em: string }[];
}

export const veiculoHistoricoService = {
  async buscar(id: number): Promise<HistoricoVeiculo> {
    const { data } = await api.get<HistoricoApi>(`/veiculos/${id}/historico`);

    return {
      veiculo: mapearVeiculo(data.veiculo),
      ordensServico: data.ordens_servico.map(mapearOrdem),
      manutencoes: data.manutencoes.map(mapearManutencao),
      fipeHistorico: data.fipe_historico.map((item) => ({
        valor: Number(item.valor),
        consultadoEm: item.consultado_em,
      })),
    };
  },
};
