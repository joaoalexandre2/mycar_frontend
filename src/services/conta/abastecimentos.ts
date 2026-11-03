import api from "../api";
import { dataISO } from "../../utils/formatters";
import type {
  AbastecimentosDoVeiculo,
  NovoAbastecimento,
} from "../../types/conta";

interface AbastecimentoApi {
  id: number;
  data: string;
  hora: string | null;
  km: number;
  litros: string | number;
  valor_total: string | number;
  tanque_cheio: boolean;
  combustivel: string | null;
  posto: string | null;
  motorista_id: number | null;
  justificativa: string | null;
  alertas: { codigo: string; mensagem: string }[] | null;
  comprovante_url: string | null;
  hodometro_url: string | null;
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
      hora: item.hora,
      motoristaId: item.motorista_id,
      justificativa: item.justificativa,
      alertas: item.alertas ?? [],
      comprovanteUrl: item.comprovante_url,
      hodometroUrl: item.hodometro_url,
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

/**
 * Erros de validação da API por campo (ex.: { km: [...], justificativa: [...] }).
 * Nulo quando o erro não é de validação.
 */
export function errosDeValidacao(error: unknown): Record<string, string[]> | null {
  const erros = (error as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } })
    .response?.data?.errors;

  return erros ?? null;
}

/** Campos do abastecimento em multipart, quando há foto para enviar. */
function formularioDoAbastecimento(abastecimento: NovoAbastecimento): FormData {
  const corpo = new FormData();

  corpo.append("data", abastecimento.data);
  corpo.append("km", String(abastecimento.km));
  corpo.append("litros", String(abastecimento.litros));
  corpo.append("valor_total", String(abastecimento.valor_total));
  corpo.append("tanque_cheio", abastecimento.tanque_cheio ? "1" : "0");

  const opcionais: [string, string | number | null | undefined][] = [
    ["combustivel", abastecimento.combustivel],
    ["posto", abastecimento.posto],
    ["hora", abastecimento.hora],
    ["motorista_id", abastecimento.motorista_id],
    ["justificativa", abastecimento.justificativa],
  ];

  for (const [campo, valor] of opcionais) {
    if (valor !== null && valor !== undefined && valor !== "") {
      corpo.append(campo, String(valor));
    }
  }

  if (abastecimento.comprovante) {
    corpo.append("comprovante", abastecimento.comprovante, "comprovante.jpg");
  }

  if (abastecimento.hodometro) {
    corpo.append("hodometro", abastecimento.hodometro, "hodometro.jpg");
  }

  return corpo;
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
    const temFoto = Boolean(abastecimento.comprovante || abastecimento.hodometro);
    const corpo = temFoto ? formularioDoAbastecimento(abastecimento) : abastecimento;

    const { data } = await api.post<AbastecimentosApi>(
      `/conta/veiculos/${veiculoId}/abastecimentos`,
      corpo,
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
