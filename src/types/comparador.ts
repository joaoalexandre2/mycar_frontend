export interface OfertaPreco {
  titulo: string;
  preco: number;
  loja: string;
  url: string;
  imagem: string | null;
  freteGratis: boolean;
}

export type StatusComparador =
  | "ok"
  | "sem_configuracao"
  | "indisponivel"
  | "sem_resultados";

export interface ResultadoComparador {
  status: StatusComparador;
  fonte: string;
  consulta: string;
  itens: OfertaPreco[];
  maisBarato: (OfertaPreco & { economiaVsMediana: number }) | null;
  totalEncontrado: number;
  mediana: number | null;
}
