import api from "./api";
import { obterItensPorPagina } from "../utils/preferencias";
import { dataISO } from "../utils/formatters";
import type {
  CodigoPeca,
  NovoCodigoPeca,
  CatalogoDePecas,
  FiltroPecas,
  Despesas,
  FiltroDespesas,
  NovoServico,
  ServicosDaConta,
  SituacaoServico,
  AbastecimentosDoVeiculo,
  DocumentosDoVeiculo,
  NovoDocumento,
  SituacaoDocumento,
  TipoDocumento,
  NovoAbastecimento,
  NovoSeguro,
  SegurosDoVeiculo,
  TipoSeguro,
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
  return {
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

interface DocumentosApi {
  documentos: {
    id: number;
    tipo: TipoDocumento;
    rotulo: string;
    titulo: string | null;
    vencimento: string | null;
    observacoes: string | null;
    dias_para_vencer: number | null;
    situacao: SituacaoDocumento;
  }[];
  crlv: { vencimento: string | null; estimativa_licenciamento: string | null };
}

export function mapearDocumentos(resposta: DocumentosApi): DocumentosDoVeiculo {
  return {
    documentos: resposta.documentos.map((item) => ({
      id: item.id,
      tipo: item.tipo,
      rotulo: item.rotulo,
      titulo: item.titulo,
      vencimento: item.vencimento ? dataISO(item.vencimento) : null,
      observacoes: item.observacoes,
      diasParaVencer: item.dias_para_vencer,
      situacao: item.situacao,
    })),
    crlvVencimento: resposta.crlv.vencimento
      ? dataISO(resposta.crlv.vencimento)
      : null,
    estimativaLicenciamento: resposta.crlv.estimativa_licenciamento
      ? dataISO(resposta.crlv.estimativa_licenciamento)
      : null,
  };
}

interface ServicosApi {
  tipos: { tipo: string; rotulo: string }[];
  servicos: {
    id: number;
    veiculo_conta_id: number;
    veiculo: string | null;
    placa: string | null;
    tipo: string;
    rotulo: string;
    titulo: string | null;
    realizado_em: string;
    km: number | null;
    valor: number | string | null;
    observacoes: string | null;
    intervalo_meses: number | null;
    intervalo_km: number | null;
    proximo_em: string | null;
    proxima_km: number | null;
    vigente: boolean;
    km_atual: number | null;
    dias_restantes: number | null;
    km_restante: number | null;
    situacao: SituacaoServico;
  }[];
}

export function mapearServicos(resposta: ServicosApi): ServicosDaConta {
  return {
    tipos: resposta.tipos,
    servicos: resposta.servicos.map((item) => ({
      id: item.id,
      veiculoContaId: item.veiculo_conta_id,
      veiculo: item.veiculo,
      placa: item.placa,
      tipo: item.tipo,
      rotulo: item.rotulo,
      titulo: item.titulo,
      realizadoEm: dataISO(item.realizado_em),
      km: item.km,
      valor: item.valor === null ? null : Number(item.valor),
      observacoes: item.observacoes,
      intervaloMeses: item.intervalo_meses,
      intervaloKm: item.intervalo_km,
      proximoEm: item.proximo_em ? dataISO(item.proximo_em) : null,
      proximaKm: item.proxima_km,
      vigente: item.vigente,
      kmAtual: item.km_atual,
      diasRestantes: item.dias_restantes,
      kmRestante: item.km_restante,
      situacao: item.situacao,
    })),
  };
}

export const servicoService = {
  async listar(): Promise<ServicosDaConta> {
    const { data } = await api.get<ServicosApi>("/conta/servicos");
    return mapearServicos(data);
  },

  async registrar(servico: NovoServico): Promise<ServicosDaConta> {
    const { data } = await api.post<ServicosApi>("/conta/servicos", servico);
    return mapearServicos(data);
  },

  async remover(id: number): Promise<ServicosDaConta> {
    const { data } = await api.delete<ServicosApi>(`/conta/servicos/${id}`);
    return mapearServicos(data);
  },
};

export const documentoService = {
  async listar(veiculoId: number): Promise<DocumentosDoVeiculo> {
    const { data } = await api.get<DocumentosApi>(`/conta/veiculos/${veiculoId}/documentos`);
    return mapearDocumentos(data);
  },

  async registrar(veiculoId: number, documento: NovoDocumento): Promise<DocumentosDoVeiculo> {
    const { data } = await api.post<DocumentosApi>(`/conta/veiculos/${veiculoId}/documentos`, documento);
    return mapearDocumentos(data);
  },

  async remover(veiculoId: number, documentoId: number): Promise<DocumentosDoVeiculo> {
    const { data } = await api.delete<DocumentosApi>(`/conta/veiculos/${veiculoId}/documentos/${documentoId}`);
    return mapearDocumentos(data);
  },
};

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

interface CodigoPecaApi {
  id: number;
  peca_id: string;
  marca: string | null;
  codigo: string;
  observacoes: string | null;
}

function mapearCodigoPeca(item: CodigoPecaApi): CodigoPeca {
  return {
    id: item.id,
    pecaId: item.peca_id,
    marca: item.marca,
    codigo: item.codigo,
    observacoes: item.observacoes,
  };
}

interface CatalogoPecasApi {
  veiculo: { id: number; nome: string; placa: string } | null;
  modelo: { nome: string; categoria: string; categoria_rotulo: string; original: string | null } | null;
  escopo: "modelo" | "geral" | "catalogo";
  total: number;
  sistemas: { chave: string; rotulo: string; total: number }[];
  pecas: {
    id: string;
    sistema: string;
    sistema_rotulo: string;
    nome: string;
    posicao: "dianteiro" | "traseiro" | null;
    intervalo_km: number | null;
    observacao: string | null;
    marcas: string[];
    meus_codigos: CodigoPecaApi[];
  }[];
  modelos_no_catalogo: number;
  aviso: string;
}

export function mapearCatalogoPecas(resposta: CatalogoPecasApi): CatalogoDePecas {
  return {
    veiculo: resposta.veiculo,
    modelo: resposta.modelo
      ? {
          nome: resposta.modelo.nome,
          categoriaRotulo: resposta.modelo.categoria_rotulo,
          original: resposta.modelo.original,
        }
      : null,
    escopo: resposta.escopo,
    total: resposta.total,
    sistemas: resposta.sistemas,
    pecas: resposta.pecas.map((peca) => ({
      id: peca.id,
      sistema: peca.sistema,
      sistemaRotulo: peca.sistema_rotulo,
      nome: peca.nome,
      posicao: peca.posicao,
      intervaloKm: peca.intervalo_km,
      observacao: peca.observacao,
      marcas: peca.marcas,
      meusCodigos: peca.meus_codigos.map(mapearCodigoPeca),
    })),
    modelosNoCatalogo: resposta.modelos_no_catalogo,
    aviso: resposta.aviso,
  };
}

export const catalogoPecasService = {
  async buscar(filtro: FiltroPecas = {}): Promise<CatalogoDePecas> {
    const { data } = await api.get<CatalogoPecasApi>("/conta/pecas-catalogo", {
      params: {
        q: filtro.q || undefined,
        veiculo_id: filtro.veiculoId || undefined,
        sistema: filtro.sistema || undefined,
      },
    });

    return mapearCatalogoPecas(data);
  },
};

export const codigoPecaService = {
  async registrar(veiculoId: number, codigo: NovoCodigoPeca): Promise<CodigoPeca> {
    const { data } = await api.post<CodigoPecaApi>(
      `/conta/veiculos/${veiculoId}/codigos-pecas`,
      codigo,
    );

    return mapearCodigoPeca(data);
  },

  async remover(veiculoId: number, codigoId: number): Promise<void> {
    await api.delete(`/conta/veiculos/${veiculoId}/codigos-pecas/${codigoId}`);
  },
};
