/** Filtros da tela financeira. Datas são dias de Brasília (AAAA-MM-DD). */
export interface FiltroFinanceiro {
  de?: string;
  ate?: string;
  veiculoId?: number;
}

export interface LinhaDeVeiculoFinanceiro {
  veiculoId: number;
  veiculo: string;
  placa: string;
  combustivel: number;
  servicos: number;
  avulsas: number;
  multas: number;
  total: number;
  kmRodados: number;
  custoPorKm: number | null;
}

export interface DestaqueDeVeiculo {
  veiculoId: number;
  placa: string;
  valor: number;
}

export interface LinhaDeMotorista {
  motoristaId: number | null;
  nome: string;
  avulsas: number;
  multas: number;
  total: number;
}

export interface LinhaDeCentro {
  centroCustoId: number | null;
  nome: string;
  total: number;
  quantidade: number;
}

export interface LinhaDoMes {
  mes: string;
  combustivel: number;
  servicos: number;
  avulsas: number;
  multas: number;
  total: number;
}

export interface ItemDeCategoria {
  categoriaId: number | null;
  rotulo: string;
  total: number;
  quantidade: number;
}

/** Consolidação de tudo que a frota custou no período. O seguro fica à parte: não entra no total. */
export interface ResumoFinanceiro {
  total: number;
  combustivel: { total: number; litros: number };
  servicos: { total: number; quantidade: number };
  avulsas: { total: number; itens: ItemDeCategoria[] };
  multas: { total: number; quantidade: number };
  seguro: { valorAnualTotal: number };
  porVeiculo: LinhaDeVeiculoFinanceiro[];
  porMotorista: LinhaDeMotorista[];
  porCentro: LinhaDeCentro[];
  mensal: LinhaDoMes[];
  indicadores: {
    custoTotal: number;
    custoMedioPorVeiculo: number;
    kmRodados: number;
    custoPorKm: number | null;
    veiculoMaiorCusto: DestaqueDeVeiculo | null;
    veiculoMaiorManutencao: DestaqueDeVeiculo | null;
  };
}

export interface CategoriaDeDespesa {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface DespesaAvulsa {
  id: number;
  data: string;
  valor: number;
  descricao: string | null;
  comprovante: string | null;
  categoria: { id: number; nome: string } | null;
  veiculo: { id: number; placa: string; nome: string } | null;
  motorista: { id: number; nome: string } | null;
  centroCusto: { id: number; nome: string } | null;
}

export interface DespesaAvulsaPayload {
  categoriaId: number;
  veiculoId: number | null;
  motoristaId: number | null;
  centroCustoId: number | null;
  data: string;
  valor: number;
  descricao: string | null;
  comprovante: string | null;
}
