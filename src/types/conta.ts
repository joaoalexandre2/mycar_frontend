/** Veículo de uma conta (perfis pessoa e frota). */
export interface VeiculoConta {
  id: number;
  apelido: string | null;
  placa: string;
  marca: string;
  modelo: string;
  /** Ano do MODELO (o da tabela FIPE). */
  ano: number;
  /** Ano de fabricação, opcional (igual ao do modelo ou um antes). */
  anoFabricacao: number | null;
  /** Como no CRLV: "2018/2019", ou só "2018". */
  anoCompleto: string;
  /** Aviso: com 15+ anos de fabricação, alguns estados isentam o IPVA (confira na Sefaz). */
  possivelIsencaoIpva: boolean;
  uf: string | null;
  ipvaEstimado: number | null;
  licenciamentoValor: number | null;
  proximoVencimentoIpva: string | null;
  proximoVencimentoLicenciamento: string | null;
  /** Próxima revisão, informada pelo dono. */
  revisaoPrevistaEm: string | null;
  fipeMarcaId: number | null;
  fipeModeloId: number | null;
  fipeAno: string | null;
  fipeValor: number | null;
  fipeConsultadoEm: string | null;
}

export interface VeiculoContaPayload {
  apelido?: string | null;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  ano_fabricacao?: number | null;
  uf?: string | null;
  revisao_prevista_em?: string | null;
  fipe_marca_id?: number | null;
  fipe_modelo_id?: number | null;
  fipe_ano?: string | null;
}

export type TipoVencimento =
  | "ipva"
  | "licenciamento"
  | "revisao"
  | "seguro"
  | "documento"
  | "servico";

export type SituacaoServico =
  | "em_dia"
  | "vence_em_breve"
  | "vencido"
  | "sem_aviso"
  | "anterior";

export interface TipoServico {
  tipo: string;
  rotulo: string;
}

export interface Servico {
  id: number;
  veiculoContaId: number;
  veiculo: string | null;
  placa: string | null;
  tipo: string;
  rotulo: string;
  titulo: string | null;
  realizadoEm: string;
  km: number | null;
  valor: number | null;
  observacoes: string | null;
  intervaloMeses: number | null;
  intervaloKm: number | null;
  proximoEm: string | null;
  proximaKm: number | null;
  /** Só o serviço mais recente de cada tipo vale para os avisos. */
  vigente: boolean;
  kmAtual: number | null;
  diasRestantes: number | null;
  kmRestante: number | null;
  situacao: SituacaoServico;
}

export interface ServicosDaConta {
  tipos: TipoServico[];
  servicos: Servico[];
}

export interface NovoServico {
  veiculo_conta_id: number;
  tipo: string;
  titulo?: string | null;
  realizado_em: string;
  km?: number | null;
  valor?: number | null;
  observacoes?: string | null;
  intervalo_meses?: number | null;
  intervalo_km?: number | null;
}

export type TipoDocumento = "crlv" | "vistoria" | "outro";

export type SituacaoDocumento =
  | "em_dia"
  | "vence_em_breve"
  | "vencido"
  | "sem_data";

export interface Documento {
  id: number;
  tipo: TipoDocumento;
  rotulo: string;
  titulo: string | null;
  vencimento: string | null;
  observacoes: string | null;
  diasParaVencer: number | null;
  situacao: SituacaoDocumento;
}

export interface DocumentosDoVeiculo {
  documentos: Documento[];
  /** Data real do CRLV (quando cadastrada) e a estimativa pela placa. */
  crlvVencimento: string | null;
  estimativaLicenciamento: string | null;
}

export interface NovoDocumento {
  tipo: TipoDocumento;
  titulo?: string | null;
  vencimento?: string | null;
  observacoes?: string | null;
}

export interface PreferenciasConta {
  nome: string | null;
  tipo: "pessoa" | "frota" | null;
  lembretesEmail: boolean;
}

export interface Vencimento {
  tipo: TipoVencimento;
  /** Nome do documento ou serviço, quando tipo = "documento" | "servico". */
  rotulo?: string;
  /** Serviços: km que faltam para a próxima troca e o km alvo. */
  kmRestante?: number | null;
  proximaKm?: number | null;
  /** Serviço que só vence por quilometragem (sem data própria). */
  porKm?: boolean;
  veiculoId: number;
  veiculo: string;
  placa: string;
  data: string;
  dias: number;
  valorEstimado: number | null;
}

export interface ResumoConta {
  nomeConta: string | null;
  tipoConta: "pessoa" | "frota" | null;
  totalVeiculos: number;
  valorTotalFipe: number;
  vencimentos: Vencimento[];
  diasAFrente: number;
  /** Consumo da conta; kmPorLitro é nulo até haver um intervalo de tanque cheio. */
  consumo: {
    kmPorLitro: number | null;
    precoMedioLitro: number | null;
    veiculosComDados: number;
  };
  gastoMes: { total: number; combustivel: number; servicos: number };
}

export const COMBUSTIVEIS = [
  { valor: "gasolina", rotulo: "Gasolina" },
  { valor: "etanol", rotulo: "Etanol" },
  { valor: "diesel", rotulo: "Diesel" },
  { valor: "gnv", rotulo: "GNV" },
  { valor: "outro", rotulo: "Outro" },
] as const;

export interface Abastecimento {
  id: number;
  data: string;
  km: number;
  litros: number;
  valorTotal: number;
  tanqueCheio: boolean;
  combustivel: string | null;
  posto: string | null;
  precoLitro: number | null;
  /** Só nos tanques cheios que fecham um intervalo. */
  consumoKmL: number | null;
  custoPorKm: number | null;
}

export interface ResumoAbastecimentos {
  consumoMedioKmL: number | null;
  custoPorKm: number | null;
  totalGasto: number;
  totalLitros: number;
  precoMedioLitro: number | null;
  kmAtual: number | null;
  quantidade: number;
}

export interface AbastecimentosDoVeiculo {
  abastecimentos: Abastecimento[];
  resumo: ResumoAbastecimentos;
}

export interface NovoAbastecimento {
  data: string;
  km: number;
  litros: number;
  valor_total: number;
  tanque_cheio: boolean;
  combustivel?: string | null;
  posto?: string | null;
}

export type TipoSeguro = "apolice" | "proposta";

export interface Seguro {
  id: number;
  tipo: TipoSeguro;
  seguradora: string;
  valorAnual: number;
  franquia: number | null;
  vigenciaFim: string | null;
  observacoes: string | null;
  valorMensal: number;
  /** % em relação à referência pelo valor FIPE (positivo = acima). */
  vsReferenciaPct: number | null;
  /** Só nas propostas: quanto sobra (ou falta) em relação ao que se paga hoje. */
  economiaVsApolice: number | null;
}

export interface SegurosDoVeiculo {
  seguros: Seguro[];
  referencia: { baixo: number; medio: number; alto: number } | null;
  apoliceAtualId: number | null;
  melhorPropostaId: number | null;
  aviso: string;
}

export interface NovoSeguro {
  tipo: TipoSeguro;
  seguradora: string;
  valor_anual: number;
  franquia?: number | null;
  vigencia_fim?: string | null;
  observacoes?: string | null;
}

export interface DespesaCombustivel {
  tipo: string;
  rotulo: string;
  total: number;
  litros: number;
  quantidade: number;
}

export interface DespesaServico {
  tipo: string;
  rotulo: string;
  total: number;
  quantidade: number;
}

export interface DespesaVeiculo {
  veiculoId: number;
  veiculo: string;
  placa: string;
  combustivel: number;
  servicos: number;
  total: number;
}

export interface DespesaSeguro {
  veiculo: string | null;
  seguradora: string;
  valorAnual: number;
  vigenciaFim: string | null;
}

export interface Despesas {
  total: number;
  combustivel: { total: number; litros: number; itens: DespesaCombustivel[] };
  servicos: { total: number; itens: DespesaServico[] };
  /** Valor anual da apólice atual: fica à parte, fora do total do período. */
  seguro: { valorAnualTotal: number; itens: DespesaSeguro[] };
  porVeiculo: DespesaVeiculo[];
}

export interface FiltroDespesas {
  de?: string;
  ate?: string;
  veiculoId?: number;
}

export interface PecaCatalogo {
  id: string;
  sistema: string;
  sistemaRotulo: string;
  nome: string;
  posicao: "dianteiro" | "traseiro" | null;
  intervaloKm: number | null;
  observacao: string | null;
  /** Marcas de reposição comuns (não garantem compatibilidade). */
  marcas: string[];
  /** Códigos que a própria pessoa confirmou para este veículo. */
  meusCodigos: CodigoPeca[];
}

export interface SistemaCatalogo {
  chave: string;
  rotulo: string;
  total: number;
}

export interface CatalogoDePecas {
  veiculo: { id: number; nome: string; placa: string } | null;
  /** Modelo do catálogo achado para o veículo, se houver. */
  modelo: { nome: string; categoriaRotulo: string; original: string | null } | null;
  /** modelo: peças do modelo; geral: só as comuns a qualquer carro; catalogo: tudo. */
  escopo: "modelo" | "geral" | "catalogo";
  total: number;
  sistemas: SistemaCatalogo[];
  pecas: PecaCatalogo[];
  modelosNoCatalogo: number;
  aviso: string;
}

export interface FiltroPecas {
  q?: string;
  veiculoId?: number;
  sistema?: string;
}

export interface CodigoPeca {
  id: number;
  pecaId: string;
  marca: string | null;
  codigo: string;
  observacoes: string | null;
}

export interface NovoCodigoPeca {
  peca_id: string;
  marca?: string | null;
  codigo: string;
  observacoes?: string | null;
}

export interface CampoFicha {
  chave: string;
  rotulo: string;
  valor: string;
}

export interface DadosFipeFicha {
  codigoFipe: string | null;
  combustivel: string | null;
  anoModelo: number | null;
  valor: number | null;
  mesReferencia: string | null;
}

/** Dados do MODELO coletados de uma fonte pública (hoje, a Wikipédia). */
export interface DadosDoModelo {
  modelo: string;
  fonte: string;
  pagina: string;
  url: string;
  licenca: string;
  coletadoEm: string;
  campos: CampoFicha[];
}

export type ManutencaoFicha = Partial<
  Record<
    | "oleo_viscosidade"
    | "oleo_especificacao"
    | "oleo_capacidade_litros"
    | "filtro_oleo"
    | "filtro_ar"
    | "filtro_combustivel"
    | "pneu_medida"
    | "pneu_pressao_dianteira"
    | "pneu_pressao_traseira"
    | "observacoes",
    string | number | null
  >
>;

export interface FichaTecnicaConta {
  veiculo: {
    id: number;
    nome: string;
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
    /** Como no CRLV: "2018/2019" (vem pronto do servidor). */
    ano_completo?: string;
    uf: string | null;
  };
  fipe: DadosFipeFicha | null;
  /** ok: consultada agora; sem_codigo: veículo sem código FIPE; indisponivel: FIPE fora do ar. */
  fipeStatus: "ok" | "sem_codigo" | "indisponivel";
  /** Lido do nome da versão (ex.: "1.4 8V Flex 5p Mec."). */
  especificacoes: CampoFicha[];
  dadosModelo: DadosDoModelo | null;
  manutencao: ManutencaoFicha | null;
}
