export type EtapaDoAtendimento = "entrada" | "atendimento" | "entrega" | "entregue";

export type FormaDePagamento = "pix" | "cartao" | "dinheiro" | "boleto";

export interface ServicoDaEstetica {
  id: number;
  nome: string;
  preco: number;
  dias_previstos: number;
  longo: boolean;
  ativo: boolean;
}

export interface PacoteDaEstetica {
  id: number;
  nome: string;
  preco: number;
  servicos: { id: number; nome: string }[];
}

export interface FotoDoAtendimento {
  id: number;
  momento: "checkin" | "checkout";
  url: string;
}

export interface AtendimentoDaEstetica {
  id: number;
  placa: string;
  modelo: string | null;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  etapa: EtapaDoAtendimento;
  etapa_seguinte: EtapaDoAtendimento | null;
  valor: number;
  total_servicos: number;
  forma_pagamento: FormaDePagamento | null;
  pago: boolean;
  dias_em_aberto: number | null;
  entrada_em: string | null;
  previsao_entrega: string | null;
  entregue_em: string | null;
  observacoes: string | null;
  servicos: { nome: string; preco: number }[];
  fotos_checkin: number;
  fotos_checkout: number;
  fotos?: FotoDoAtendimento[];
}

export interface HistoricoDaPlaca {
  placa: string;
  modelo: string | null;
  total_gasto: number;
  ultima_entrega: string | null;
  retorno_previsto: string | null;
  atendimentos: {
    id: number;
    entrada_em: string | null;
    etapa: EtapaDoAtendimento;
    servicos: string[];
    total: number;
    pago: boolean;
  }[];
}

export interface FinanceiroDaEstetica {
  total_em_aberto: number;
  quantidade_em_aberto: number;
  por_forma: Record<string, { quantidade: number; valor: number }>;
  contas: {
    id: number;
    placa: string;
    cliente_nome: string | null;
    etapa: EtapaDoAtendimento;
    valor: number;
    forma_pagamento: FormaDePagamento | null;
    dias_em_aberto: number | null;
  }[];
}
