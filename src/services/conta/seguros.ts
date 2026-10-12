import api from "../api";
import { dataISO } from "../../utils/formatters";
import type {
  NovoSeguro,
  SegurosDoVeiculo,
  TipoSeguro,
} from "../../types/conta";

interface SeguroApi {
  id: number;
  tipo: TipoSeguro;
  seguradora: string;
  valor_anual: string | number;
  franquia: string | number | null;
  vigencia_fim: string | null;
  observacoes: string | null;
  valor_mensal: number;
  vs_referencia_pct: number | null;
  economia_vs_apolice: number | null;
}

interface SegurosApi {
  seguros: SeguroApi[];
  referencia: { baixo: number; medio: number; alto: number } | null;
  apolice_atual_id: number | null;
  melhor_proposta_id: number | null;
  aviso: string;
}

export function mapearSeguros(resposta: SegurosApi): SegurosDoVeiculo {
  return {
    seguros: resposta.seguros.map((item) => ({
      id: item.id,
      tipo: item.tipo,
      seguradora: item.seguradora,
      valorAnual: Number(item.valor_anual),
      franquia: item.franquia === null ? null : Number(item.franquia),
      vigenciaFim: item.vigencia_fim ? dataISO(item.vigencia_fim) : null,
      observacoes: item.observacoes,
      valorMensal: item.valor_mensal,
      vsReferenciaPct: item.vs_referencia_pct,
      economiaVsApolice: item.economia_vs_apolice,
    })),
    referencia: resposta.referencia,
    apoliceAtualId: resposta.apolice_atual_id,
    melhorPropostaId: resposta.melhor_proposta_id,
    aviso: resposta.aviso,
  };
}

export const seguroService = {
  async listar(veiculoId: number): Promise<SegurosDoVeiculo> {
    const { data } = await api.get<SegurosApi>(`/conta/veiculos/${veiculoId}/seguros`);
    return mapearSeguros(data);
  },

  async registrar(veiculoId: number, seguro: NovoSeguro): Promise<SegurosDoVeiculo> {
    const { data } = await api.post<SegurosApi>(`/conta/veiculos/${veiculoId}/seguros`, seguro);
    return mapearSeguros(data);
  },

  async remover(veiculoId: number, seguroId: number): Promise<SegurosDoVeiculo> {
    const { data } = await api.delete<SegurosApi>(`/conta/veiculos/${veiculoId}/seguros/${seguroId}`);
    return mapearSeguros(data);
  },
};
