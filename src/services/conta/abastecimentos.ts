import api from "../api";
import { dataISO } from "../../utils/formatters";
import type {
  AbastecimentosDoVeiculo,
  NovoAbastecimento,
} from "../../types/conta";

interface AbastecimentoApi {
  id: number;
  data: string;
  km: number;
  litros: string | number;
  valor_total: string | number;
  tanque_cheio: boolean;
  combustivel: string | null;
  posto: string | null;
  preco_litro: number | null;
  consumo_km_l: number | null;
  custo_por_km: number | null;
}

interface AbastecimentosApi {
  tanque_litros?: number | string | null;
  abastecimentos: AbastecimentoApi[];
  resumo: {
    consumo_medio_km_l: number | null;
    custo_por_km: number | null;
    total_gasto: number;
    total_litros: number;
    preco_medio_litro: number | null;
    km_atual: number | null;
    quantidade: number;
  };
}

export function mapearAbastecimentos(resposta: AbastecimentosApi): AbastecimentosDoVeiculo {
  const tanque = resposta.tanque_litros == null ? null : Number(resposta.tanque_litros);

  return {
    tanqueLitros: tanque !== null && tanque > 0 ? tanque : null,
    abastecimentos: resposta.abastecimentos.map((item) => ({
      id: item.id,
      data: dataISO(item.data),
      km: item.km,
      litros: Number(item.litros),
      valorTotal: Number(item.valor_total),
      tanqueCheio: item.tanque_cheio,
      combustivel: item.combustivel,
      posto: item.posto,
      precoLitro: item.preco_litro,
      consumoKmL: item.consumo_km_l,
      custoPorKm: item.custo_por_km,
    })),
    resumo: {
      consumoMedioKmL: resposta.resumo.consumo_medio_km_l,
      custoPorKm: resposta.resumo.custo_por_km,
      totalGasto: resposta.resumo.total_gasto,
      totalLitros: resposta.resumo.total_litros,
      precoMedioLitro: resposta.resumo.preco_medio_litro,
      kmAtual: resposta.resumo.km_atual,
      quantidade: resposta.resumo.quantidade,
    },
  };
}

export const abastecimentoService = {
  async listar(veiculoId: number): Promise<AbastecimentosDoVeiculo> {
    const { data } = await api.get<AbastecimentosApi>(
      `/conta/veiculos/${veiculoId}/abastecimentos`,
    );
    return mapearAbastecimentos(data);
  },

  async registrar(
    veiculoId: number,
    abastecimento: NovoAbastecimento,
  ): Promise<AbastecimentosDoVeiculo> {
    const { data } = await api.post<AbastecimentosApi>(
      `/conta/veiculos/${veiculoId}/abastecimentos`,
      abastecimento,
    );
    return mapearAbastecimentos(data);
  },

  async remover(
    veiculoId: number,
    abastecimentoId: number,
  ): Promise<AbastecimentosDoVeiculo> {
    const { data } = await api.delete<AbastecimentosApi>(
      `/conta/veiculos/${veiculoId}/abastecimentos/${abastecimentoId}`,
    );
    return mapearAbastecimentos(data);
  },
};
