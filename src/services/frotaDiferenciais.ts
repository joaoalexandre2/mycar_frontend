import api from "./api";
import type {
  AlertasDaFrota,
  ChecklistRegistrado,
  ModeloDeChecklist,
  Multa,
  MomentoDoChecklist,
  PainelDeDisponibilidade,
  ResolucaoDoQr,
  RespostaDeChecklists,
  SituacaoDoItem,
  SugestaoDeResponsavel,
} from "../types/frota";

/** Checklist de saída e de devolução de uma reserva. */
export const checklistService = {
  async listar(usoId: number): Promise<RespostaDeChecklists> {
    const { data } = await api.get<RespostaDeChecklists>(`/conta/usos/${usoId}/checklist`);

    return data;
  },

  async enviar(
    usoId: number,
    payload: {
      momento: MomentoDoChecklist;
      checklist_modelo_id?: number | null;
      itens: { item: string; ok?: boolean; situacao?: SituacaoDoItem; observacao?: string | null }[];
      observacoes?: string | null;
    },
  ): Promise<ChecklistRegistrado> {
    const { data } = await api.post<ChecklistRegistrado>(`/conta/usos/${usoId}/checklist`, payload);

    return data;
  },
};

/** Modelos de checklist da empresa (só administrador e gestor). */
export interface ItemDeModelo {
  chave?: string;
  rotulo: string;
  obrigatorio: boolean;
}

export interface PayloadDeModelo {
  nome: string;
  momento: MomentoDoChecklist | "ambos";
  ativo?: boolean;
  itens: ItemDeModelo[];
}

export const checklistModelosService = {
  async listar(): Promise<ModeloDeChecklist[]> {
    const { data } = await api.get<ModeloDeChecklist[]>("/conta/checklists/modelos");

    return data;
  },

  async criar(payload: PayloadDeModelo): Promise<ModeloDeChecklist> {
    const { data } = await api.post<ModeloDeChecklist>("/conta/checklists/modelos", payload);

    return data;
  },

  async atualizar(id: number, payload: PayloadDeModelo): Promise<ModeloDeChecklist> {
    const { data } = await api.put<ModeloDeChecklist>(`/conta/checklists/modelos/${id}`, payload);

    return data;
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/conta/checklists/modelos/${id}`);
  },
};

/** QR Code de cada veículo. */
export const qrService = {
  async gerar(veiculoId: number): Promise<{ token: string; url: string }> {
    const { data } = await api.post<{ token: string; url: string }>(`/conta/veiculos/${veiculoId}/qr`, {});

    return data;
  },

  async resolver(token: string): Promise<ResolucaoDoQr> {
    const { data } = await api.get<ResolucaoDoQr>(`/conta/qr/${encodeURIComponent(token)}`);

    return data;
  },
};

export interface PaginaDeMultas {
  dados: Multa[];
  paginaAtual: number;
  totalPaginas: number;
  totalRegistros: number;
}

interface RespostaDeMultas {
  data: Multa[];
  meta: { current_page: number; last_page: number; total: number };
}

/** Multas da frota. */
export const multasService = {
  async listar(filtro: { veiculoId?: number; situacao?: string; pagina?: number } = {}): Promise<PaginaDeMultas> {
    const { data } = await api.get<RespostaDeMultas>("/conta/multas", {
      params: {
        page: filtro.pagina ?? 1,
        ...(filtro.veiculoId ? { veiculo_conta_id: filtro.veiculoId } : {}),
        ...(filtro.situacao ? { situacao: filtro.situacao } : {}),
      },
    });

    return {
      dados: data.data,
      paginaAtual: data.meta.current_page,
      totalPaginas: data.meta.last_page,
      totalRegistros: data.meta.total,
    };
  },

  async sugerirResponsavel(veiculoId: number, dataHora: string): Promise<SugestaoDeResponsavel> {
    const { data } = await api.get<SugestaoDeResponsavel>("/conta/multas/sugerir-responsavel", {
      params: { veiculo_conta_id: veiculoId, data_hora: dataHora },
    });

    return data;
  },

  async criar(payload: {
    veiculo_conta_id: number;
    data_hora: string;
    descricao: string;
    valor?: number | null;
    pontos?: number | null;
    motorista_id?: number | null;
    observacoes?: string | null;
  }): Promise<Multa> {
    const { data } = await api.post<Multa>("/conta/multas", payload);

    return data;
  },

  async atualizar(id: number, payload: Partial<Pick<Multa, "situacao" | "observacoes">>): Promise<Multa> {
    const { data } = await api.put<Multa>(`/conta/multas/${id}`, payload);

    return data;
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/conta/multas/${id}`);
  },
};

/** Alertas e painel de disponibilidade da frota. */
export const painelFrotaService = {
  async alertas(): Promise<AlertasDaFrota> {
    const { data } = await api.get<AlertasDaFrota>("/conta/alertas");

    return data;
  },

  async disponibilidade(de?: string, ate?: string): Promise<PainelDeDisponibilidade> {
    const { data } = await api.get<PainelDeDisponibilidade>("/conta/painel-frota", {
      params: { ...(de ? { de } : {}), ...(ate ? { ate } : {}) },
    });

    return data;
  },
};
