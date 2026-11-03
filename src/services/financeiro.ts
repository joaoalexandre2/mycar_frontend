import api from "./api";
import type {
  CategoriaDeDespesa,
  DespesaAvulsa,
  DespesaAvulsaPayload,
  FiltroFinanceiro,
  ResumoFinanceiro,
} from "../types/financeiro";

interface DestaqueApi {
  veiculo_id: number;
  placa: string;
  valor: number;
}

interface ResumoApi {
  total: number;
  combustivel: { total: number; litros: number };
  servicos: { total: number; itens: { quantidade: number }[] };
  avulsas: { total: number; itens: { categoria_id: number | null; rotulo: string; total: number; quantidade: number }[] };
  multas: { total: number; quantidade: number };
  seguro: { valor_anual_total: number };
  por_veiculo: {
    veiculo_id: number;
    veiculo: string;
    placa: string;
    combustivel: number;
    servicos: number;
    avulsas: number;
    multas: number;
    total: number;
    km_rodados: number;
    custo_por_km: number | null;
  }[];
  por_motorista: { motorista_id: number | null; nome: string; avulsas: number; multas: number; total: number }[];
  por_centro: { centro_custo_id: number | null; nome: string; total: number; quantidade: number }[];
  mensal: { mes: string; combustivel: number; servicos: number; avulsas: number; multas: number; total: number }[];
  indicadores: {
    custo_total: number;
    custo_medio_por_veiculo: number;
    km_rodados: number;
    custo_por_km: number | null;
    veiculo_maior_custo: DestaqueApi | null;
    veiculo_maior_manutencao: DestaqueApi | null;
  };
}

interface DespesaAvulsaApi {
  id: number;
  data: string;
  valor: number;
  descricao: string | null;
  comprovante: string | null;
  categoria: { id: number; nome: string } | null;
  veiculo: { id: number; placa: string; nome: string } | null;
  motorista: { id: number; nome: string } | null;
  centro_custo: { id: number; nome: string } | null;
}

interface RespostaPaginadaApi<T> {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
}

const destaque = (d: DestaqueApi | null) =>
  d ? { veiculoId: d.veiculo_id, placa: d.placa, valor: d.valor } : null;

/** Converte a resposta da consolidação para o formato que a tela usa. */
export function mapearResumoFinanceiro(r: ResumoApi): ResumoFinanceiro {
  return {
    total: r.total,
    combustivel: { total: r.combustivel.total, litros: r.combustivel.litros },
    servicos: { total: r.servicos.total, quantidade:r.servicos.itens.reduce((soma, i) => soma + i.quantidade, 0) },
    avulsas: {
      total: r.avulsas.total,
      itens: r.avulsas.itens.map((i) => ({ categoriaId: i.categoria_id, rotulo: i.rotulo, total: i.total, quantidade: i.quantidade })),
    },
    multas: { total: r.multas.total, quantidade: r.multas.quantidade },
    seguro: { valorAnualTotal: r.seguro.valor_anual_total },
    porVeiculo: r.por_veiculo.map((v) => ({
      veiculoId: v.veiculo_id,
      veiculo: v.veiculo,
      placa: v.placa,
      combustivel: v.combustivel,
      servicos: v.servicos,
      avulsas: v.avulsas,
      multas: v.multas,
      total: v.total,
      kmRodados: v.km_rodados,
      custoPorKm: v.custo_por_km,
    })),
    porMotorista: r.por_motorista.map((m) => ({
      motoristaId: m.motorista_id,
      nome: m.nome,
      avulsas: m.avulsas,
      multas: m.multas,
      total: m.total,
    })),
    porCentro: r.por_centro.map((c) => ({
      centroCustoId: c.centro_custo_id,
      nome: c.nome,
      total: c.total,
      quantidade: c.quantidade,
    })),
    mensal: r.mensal,
    indicadores: {
      custoTotal: r.indicadores.custo_total,
      custoMedioPorVeiculo: r.indicadores.custo_medio_por_veiculo,
      kmRodados: r.indicadores.km_rodados,
      custoPorKm: r.indicadores.custo_por_km,
      veiculoMaiorCusto: destaque(r.indicadores.veiculo_maior_custo),
      veiculoMaiorManutencao: destaque(r.indicadores.veiculo_maior_manutencao),
    },
  };
}

function mapearDespesa(d: DespesaAvulsaApi): DespesaAvulsa {
  return {
    id: d.id,
    data: d.data,
    valor: d.valor,
    descricao: d.descricao,
    comprovante: d.comprovante,
    categoria: d.categoria,
    veiculo: d.veiculo,
    motorista: d.motorista,
    centroCusto: d.centro_custo,
  };
}

function corpoDaDespesa(p: DespesaAvulsaPayload) {
  return {
    categoria_id: p.categoriaId,
    veiculo_conta_id: p.veiculoId,
    motorista_id: p.motoristaId,
    centro_custo_id: p.centroCustoId,
    data: p.data,
    valor: p.valor,
    descricao: p.descricao,
    comprovante: p.comprovante,
  };
}

export const financeiroService = {
  async resumo(filtro: FiltroFinanceiro = {}): Promise<ResumoFinanceiro> {
    const { data } = await api.get<ResumoApi>("/conta/despesas", {
      params: {
        de: filtro.de || undefined,
        ate: filtro.ate || undefined,
        veiculo_id: filtro.veiculoId || undefined,
      },
    });

    return mapearResumoFinanceiro(data);
  },
};

export const despesasAvulsasService = {
  async listar(pagina = 1, filtro: FiltroFinanceiro = {}) {
    const { data } = await api.get<RespostaPaginadaApi<DespesaAvulsaApi>>("/conta/despesas/avulsas", {
      params: {
        page: pagina,
        de: filtro.de || undefined,
        ate: filtro.ate || undefined,
        veiculo_id: filtro.veiculoId || undefined,
      },
    });

    return {
      dados: data.data.map(mapearDespesa),
      paginaAtual: data.meta.current_page,
      totalPaginas: data.meta.last_page,
      totalRegistros: data.meta.total,
    };
  },

  async criar(payload: DespesaAvulsaPayload): Promise<DespesaAvulsa> {
    const { data } = await api.post<DespesaAvulsaApi>("/conta/despesas/avulsas", corpoDaDespesa(payload));

    return mapearDespesa(data);
  },

  async atualizar(id: number, payload: DespesaAvulsaPayload): Promise<DespesaAvulsa> {
    const { data } = await api.put<DespesaAvulsaApi>(`/conta/despesas/avulsas/${id}`, corpoDaDespesa(payload));

    return mapearDespesa(data);
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/conta/despesas/avulsas/${id}`);
  },
};

export const categoriasDeDespesaService = {
  async listar(): Promise<CategoriaDeDespesa[]> {
    const { data } = await api.get<CategoriaDeDespesa[]>("/conta/despesas/categorias");

    return data;
  },

  async criar(nome: string): Promise<CategoriaDeDespesa> {
    const { data } = await api.post<CategoriaDeDespesa>("/conta/despesas/categorias", { nome });

    return data;
  },

  async alterar(id: number, campos: { nome?: string; ativo?: boolean }): Promise<CategoriaDeDespesa> {
    const { data } = await api.put<CategoriaDeDespesa>(`/conta/despesas/categorias/${id}`, campos);

    return data;
  },
};
