import api from "../api";
import { obterItensPorPagina } from "../../utils/preferencias";
import { dataISO } from "../../utils/formatters";
import { urlDaFoto } from "../../utils/imagem";
import type {
  PreferenciasConta,
  ResumoConta,
  TipoVencimento,
  VeiculoConta,
  VeiculoContaPayload,
} from "../../types/conta";

interface VeiculoContaApi {
  id: number;
  apelido?: string | null;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  ano_fabricacao?: number | null;
  ano_completo?: string | null;
  possivel_isencao_ipva?: boolean;
  foto_capa_url?: string | null;
  foto_modelo?: {
    modelo: string;
    url: string;
    autor?: string | null;
    licenca?: string | null;
    licenca_url?: string | null;
    pagina?: string | null;
    fonte?: string | null;
  } | null;
  uf?: string | null;
  revisao_prevista_em?: string | null;
  ipva_estimado?: number | null;
  ipva_aliquota_media?: boolean;
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
  consumo?: {
    km_por_litro: number | null;
    preco_medio_litro: number | null;
    veiculos_com_dados: number;
  };
  gasto_mes?: { total: number; combustivel: number; servicos: number };
  vencimentos: {
    tipo: TipoVencimento;
    rotulo?: string;
    km_restante?: number | null;
    proxima_km?: number | null;
    por_km?: boolean;
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
    anoFabricacao: item.ano_fabricacao ?? null,
    anoCompleto: item.ano_completo ?? String(item.ano),
    possivelIsencaoIpva: Boolean(item.possivel_isencao_ipva),
    fotoCapaUrl: item.foto_capa_url ? urlDaFoto(item.foto_capa_url) : null,
    fotoModelo: item.foto_modelo
      ? {
          modelo: item.foto_modelo.modelo,
          url: urlDaFoto(item.foto_modelo.url),
          autor: item.foto_modelo.autor ?? null,
          licenca: item.foto_modelo.licenca ?? null,
          licencaUrl: item.foto_modelo.licenca_url ?? null,
          pagina: item.foto_modelo.pagina ?? null,
          fonte: item.foto_modelo.fonte ?? "Wikimedia Commons",
        }
      : null,
    uf: item.uf ?? null,
    ipvaEstimado: item.ipva_estimado ?? null,
    ipvaAliquotaMedia: Boolean(item.ipva_aliquota_media),
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
    consumo: {
      kmPorLitro: resumo.consumo?.km_por_litro ?? null,
      precoMedioLitro: resumo.consumo?.preco_medio_litro ?? null,
      veiculosComDados: resumo.consumo?.veiculos_com_dados ?? 0,
    },
    gastoMes: resumo.gasto_mes ?? { total: 0, combustivel: 0, servicos: 0 },
    vencimentos: resumo.vencimentos.map((item) => ({
      tipo: item.tipo,
      rotulo: item.rotulo,
      kmRestante: item.km_restante,
      proximaKm: item.proxima_km,
      porKm: item.por_km,
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
