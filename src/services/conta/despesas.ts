import api from "../api";
import { dataISO } from "../../utils/formatters";
import type { Despesas, FiltroDespesas } from "../../types/conta";

interface DespesasApi {
  total: number;
  combustivel: {
    total: number;
    litros: number;
    itens: { tipo: string; rotulo: string; total: number; litros: number; quantidade: number }[];
  };
  servicos: {
    total: number;
    itens: { tipo: string; rotulo: string; total: number; quantidade: number }[];
  };
  seguro: {
    valor_anual_total: number;
    itens: {
      veiculo: string | null;
      seguradora: string;
      valor_anual: number;
      vigencia_fim: string | null;
    }[];
  };
  por_veiculo: {
    veiculo_id: number;
    veiculo: string;
    placa: string;
    combustivel: number;
    servicos: number;
    total: number;
  }[];
}

export function mapearDespesas(resposta: DespesasApi): Despesas {
  return {
    total: resposta.total,
    combustivel: resposta.combustivel,
    servicos: resposta.servicos,
    seguro: {
      valorAnualTotal: resposta.seguro.valor_anual_total,
      itens: resposta.seguro.itens.map((item) => ({
        veiculo: item.veiculo,
        seguradora: item.seguradora,
        valorAnual: item.valor_anual,
        vigenciaFim: item.vigencia_fim ? dataISO(item.vigencia_fim) : null,
      })),
    },
    porVeiculo: resposta.por_veiculo.map((item) => ({
      veiculoId: item.veiculo_id,
      veiculo: item.veiculo,
      placa: item.placa,
      combustivel: item.combustivel,
      servicos: item.servicos,
      total: item.total,
    })),
  };
}

export const despesaService = {
  async listar(filtro: FiltroDespesas = {}): Promise<Despesas> {
    const { data } = await api.get<DespesasApi>("/conta/despesas", {
      params: {
        de: filtro.de || undefined,
        ate: filtro.ate || undefined,
        veiculo_id: filtro.veiculoId || undefined,
      },
    });

    return mapearDespesas(data);
  },
};
