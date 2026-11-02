import api from "./api";
import type {
  AtendimentoDaEstetica,
  FinanceiroDaEstetica,
  FormaDePagamento,
  HistoricoDaPlaca,
  PacoteDaEstetica,
  ServicoDaEstetica,
} from "../types/estetica";

export const catalogoEsteticaService = {
  async servicos(): Promise<ServicoDaEstetica[]> {
    const { data } = await api.get<ServicoDaEstetica[]>("/estetica/servicos");

    return data;
  },

  async criarServico(payload: { nome: string; preco: number; dias_previstos?: number }): Promise<ServicoDaEstetica> {
    const { data } = await api.post<ServicoDaEstetica>("/estetica/servicos", payload);

    return data;
  },

  async pacotes(): Promise<PacoteDaEstetica[]> {
    const { data } = await api.get<PacoteDaEstetica[]>("/estetica/pacotes");

    return data;
  },

  async criarPacote(payload: { nome: string; preco: number; servicos: number[] }): Promise<PacoteDaEstetica> {
    const { data } = await api.post<PacoteDaEstetica>("/estetica/pacotes", payload);

    return data;
  },

  async removerPacote(id: number): Promise<void> {
    await api.delete(`/estetica/pacotes/${id}`);
  },
};

export const patioService = {
  async listar(): Promise<AtendimentoDaEstetica[]> {
    const { data } = await api.get<AtendimentoDaEstetica[]>("/estetica/atendimentos");

    return data;
  },

  async detalhe(id: number): Promise<AtendimentoDaEstetica> {
    const { data } = await api.get<AtendimentoDaEstetica>(`/estetica/atendimentos/${id}`);

    return data;
  },

  async criar(payload: {
    placa: string;
    modelo?: string | null;
    cliente_nome?: string | null;
    cliente_telefone?: string | null;
    servicos?: number[];
    pacote_id?: number | null;
    observacoes?: string | null;
  }): Promise<AtendimentoDaEstetica> {
    const { data } = await api.post<AtendimentoDaEstetica>("/estetica/atendimentos", payload);

    return data;
  },

  async avancar(id: number): Promise<AtendimentoDaEstetica> {
    const { data } = await api.post<AtendimentoDaEstetica>(`/estetica/atendimentos/${id}/avancar`, {});

    return data;
  },

  async atualizar(
    id: number,
    payload: { valor?: number; forma_pagamento?: FormaDePagamento | null; pago?: boolean; observacoes?: string | null },
  ): Promise<AtendimentoDaEstetica> {
    const { data } = await api.put<AtendimentoDaEstetica>(`/estetica/atendimentos/${id}`, payload);

    return data;
  },

  async enviarFoto(id: number, momento: "checkin" | "checkout", arquivo: File): Promise<void> {
    const corpo = new FormData();
    corpo.append("momento", momento);
    corpo.append("foto", arquivo);

    await api.post(`/estetica/atendimentos/${id}/fotos`, corpo, { headers: { "Content-Type": "multipart/form-data" } });
  },
};

export const historicoEsteticaService = {
  async placa(placa: string): Promise<HistoricoDaPlaca> {
    const { data } = await api.get<HistoricoDaPlaca>(`/estetica/placas/${encodeURIComponent(placa)}`);

    return data;
  },
};

export const financeiroEsteticaService = {
  async listar(): Promise<FinanceiroDaEstetica> {
    const { data } = await api.get<FinanceiroDaEstetica>("/estetica/financeiro");

    return data;
  },
};
