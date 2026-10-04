import api from "./api";
import { obterItensPorPagina } from "../utils/preferencias";

interface ResumoApi {
  oficinas: number;
  usuarios: number;
  email_pendente: number;
  cadastros_7_dias: number;
  cadastros_30_dias: number;
  ativos_7_dias: number;
  totais: {
    clientes: number;
    veiculos: number;
    ordens_servico: number;
    manutencoes: number;
  };
}

interface ContaApi {
  id: number;
  nome: string;
  email: string;
  email_confirmado: boolean;
  email_confirmado_em: string | null;
  cadastro_em: string | null;
  ultimo_acesso_em: string | null;
  admin: boolean;
  oficina: { id: number; nome: string } | null;
  totais: {
    clientes: number;
    veiculos: number;
    ordens_servico: number;
    manutencoes: number;
  };
}

interface RespostaContasApi {
  data: ContaApi[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ResumoPlataforma {
  oficinas: number;
  usuarios: number;
  emailPendente: number;
  cadastros7Dias: number;
  cadastros30Dias: number;
  ativos7Dias: number;
  totais: {
    clientes: number;
    veiculos: number;
    ordensServico: number;
    manutencoes: number;
  };
}

export interface ContaAdmin {
  id: number;
  nome: string;
  email: string;
  emailConfirmado: boolean;
  cadastroEm: string | null;
  ultimoAcessoEm: string | null;
  admin: boolean;
  oficina: string | null;
  totais: {
    clientes: number;
    veiculos: number;
    ordensServico: number;
    manutencoes: number;
  };
}

export interface PaginaContas {
  dados: ContaAdmin[];
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
}

export interface ListarContasParams {
  pagina?: number;
  busca?: string;
  porPagina?: number;
}

export function mapearResumo(resumo: ResumoApi): ResumoPlataforma {
  return {
    oficinas: resumo.oficinas,
    usuarios: resumo.usuarios,
    emailPendente: resumo.email_pendente,
    cadastros7Dias: resumo.cadastros_7_dias,
    cadastros30Dias: resumo.cadastros_30_dias,
    ativos7Dias: resumo.ativos_7_dias,
    totais: {
      clientes: resumo.totais.clientes,
      veiculos: resumo.totais.veiculos,
      ordensServico: resumo.totais.ordens_servico,
      manutencoes: resumo.totais.manutencoes,
    },
  };
}

export function mapearConta(conta: ContaApi): ContaAdmin {
  return {
    id: conta.id,
    nome: conta.nome,
    email: conta.email,
    emailConfirmado: conta.email_confirmado,
    cadastroEm: conta.cadastro_em,
    ultimoAcessoEm: conta.ultimo_acesso_em,
    admin: conta.admin,
    oficina: conta.oficina?.nome ?? null,
    totais: {
      clientes: conta.totais.clientes,
      veiculos: conta.totais.veiculos,
      ordensServico: conta.totais.ordens_servico,
      manutencoes: conta.totais.manutencoes,
    },
  };
}

export const adminService = {
  async resumo(): Promise<ResumoPlataforma> {
    const { data } = await api.get<ResumoApi>("/admin/resumo");
    return mapearResumo(data);
  },

  async contas(params: ListarContasParams = {}): Promise<PaginaContas> {
    const { data } = await api.get<RespostaContasApi>("/admin/contas", {
      params: {
        page: params.pagina ?? 1,
        per_page: params.porPagina ?? obterItensPorPagina(),
        ...(params.busca ? { busca: params.busca } : {}),
      },
    });

    return {
      dados: data.data.map(mapearConta),
      paginaAtual: data.meta.current_page,
      totalPaginas: data.meta.last_page,
      totalRegistros: data.meta.total,
    };
  },

  async reenviarConfirmacao(id: number): Promise<string> {
    const { data } = await api.post<{ message: string }>(
      `/admin/contas/${id}/reenviar-confirmacao`,
    );
    return data.message;
  },
};
