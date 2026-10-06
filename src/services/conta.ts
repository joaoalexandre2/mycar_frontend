import api from "./api";
import { obterItensPorPagina } from "../utils/preferencias";
import { dataISO } from "../utils/formatters";
import type {
  PreferenciasConta,
  ResumoConta,
  TipoVencimento,
  VeiculoConta,
  VeiculoContaPayload,
} from "../types/conta";

interface VeiculoContaApi {
  id: number;
  apelido?: string | null;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  uf?: string | null;
  revisao_prevista_em?: string | null;
  ipva_estimado?: number | null;
  licenciamento_valor?: number | null;
  proximo_vencimento_ipva?: string | null;
  proximo_vencimento_licenciamento?: string | null;
  fipe_marca_id?: number | null;
  fipe_modelo_id?: number | null;
  fipe_ano?: string | null;
  fipe_valor?: number | string | null;
  fipe_consultado_em?: string | null;
}

interface ResumoContaApi {
  conta: { nome: string | null; tipo: "pessoa" | "frota" | null };
  total_veiculos: number;
  valor_total_fipe: number;
  dias_a_frente: number;
  vencimentos: {
    tipo: TipoVencimento;
    veiculo_id: number;
    veiculo: string;
    placa: string;
    data: string;
    dias: number;
    valor_estimado: number | null;
  }[];
}

interface RespostaPaginadaApi {
  data: VeiculoContaApi[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  resumo: { total: number; valorTotalFipe: number };
}

export interface ListarVeiculosContaParams {
  pagina?: number;
  busca?: string;
  porPagina?: number;
}

export interface PaginaVeiculosConta {
  dados: VeiculoConta[];
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
  valorTotalFipe: number;
}

export function mapearVeiculoConta(item: VeiculoContaApi): VeiculoConta {
  return {
    id: item.id,
    apelido: item.apelido ?? null,
    placa: item.placa,
    marca: item.marca,
    modelo: item.modelo,
    ano: item.ano,
    uf: item.uf ?? null,
    ipvaEstimado: item.ipva_estimado ?? null,
    licenciamentoValor: item.licenciamento_valor ?? null,
    proximoVencimentoIpva: item.proximo_vencimento_ipva
      ? dataISO(item.proximo_vencimento_ipva)
      : null,
    proximoVencimentoLicenciamento: item.proximo_vencimento_licenciamento
      ? dataISO(item.proximo_vencimento_licenciamento)
      : null,
    revisaoPrevistaEm: item.revisao_prevista_em
      ? dataISO(item.revisao_prevista_em)
      : null,
    fipeMarcaId: item.fipe_marca_id ?? null,
    fipeModeloId: item.fipe_modelo_id ?? null,
    fipeAno: item.fipe_ano ?? null,
    fipeValor:
      item.fipe_valor === null || item.fipe_valor === undefined
        ? null
        : Number(item.fipe_valor),
    fipeConsultadoEm: item.fipe_consultado_em ?? null,
  };
}

export function mapearResumoConta(resumo: ResumoContaApi): ResumoConta {
  return {
    nomeConta: resumo.conta.nome,
    tipoConta: resumo.conta.tipo,
    totalVeiculos: resumo.total_veiculos,
    valorTotalFipe: resumo.valor_total_fipe,
    diasAFrente: resumo.dias_a_frente,
    vencimentos: resumo.vencimentos.map((item) => ({
      tipo: item.tipo,
      veiculoId: item.veiculo_id,
      veiculo: item.veiculo,
      placa: item.placa,
      data: dataISO(item.data),
      dias: item.dias,
      valorEstimado: item.valor_estimado,
    })),
  };
}

interface PreferenciasContaApi {
  nome: string | null;
  tipo: "pessoa" | "frota" | null;
  lembretes_email: boolean;
}

export function mapearPreferencias(p: PreferenciasContaApi): PreferenciasConta {
  return { nome: p.nome, tipo: p.tipo, lembretesEmail: p.lembretes_email };
}

export const contaService = {
  async resumo(): Promise<ResumoConta> {
    const { data } = await api.get<ResumoContaApi>("/conta/resumo");
    return mapearResumoConta(data);
  },

  async listarVeiculos(
    params: ListarVeiculosContaParams = {},
  ): Promise<PaginaVeiculosConta> {
    const { data } = await api.get<RespostaPaginadaApi>("/conta/veiculos", {
      params: {
        page: params.pagina ?? 1,
        per_page: params.porPagina ?? obterItensPorPagina(),
        busca: params.busca || undefined,
      },
    });

    return {
      dados: data.data.map(mapearVeiculoConta),
      paginaAtual: data.meta.current_page,
      totalPaginas: data.meta.last_page,
      totalRegistros: data.meta.total,
      valorTotalFipe: data.resumo.valorTotalFipe,
    };
  },

  async criarVeiculo(payload: VeiculoContaPayload): Promise<VeiculoConta> {
    const { data } = await api.post<VeiculoContaApi>("/conta/veiculos", payload);
    return mapearVeiculoConta(data);
  },

  async atualizarVeiculo(
    id: number,
    payload: VeiculoContaPayload,
  ): Promise<VeiculoConta> {
    const { data } = await api.put<VeiculoContaApi>(
      `/conta/veiculos/${id}`,
      payload,
    );
    return mapearVeiculoConta(data);
  },

  async removerVeiculo(id: number): Promise<void> {
    await api.delete(`/conta/veiculos/${id}`);
  },

  async preferencias(): Promise<PreferenciasConta> {
    const { data } = await api.get<PreferenciasContaApi>("/conta/preferencias");
    return mapearPreferencias(data);
  },

  async atualizarPreferencias(lembretesEmail: boolean): Promise<PreferenciasConta> {
    const { data } = await api.put<PreferenciasContaApi>("/conta/preferencias", {
      lembretes_email: lembretesEmail,
    });
    return mapearPreferencias(data);
  },

  async consultarFipe(id: number): Promise<VeiculoConta> {
    const { data } = await api.post<VeiculoContaApi>(
      `/conta/veiculos/${id}/fipe`,
    );
    return mapearVeiculoConta(data);
  },
};
