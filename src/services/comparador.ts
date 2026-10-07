import api from "./api";
import type { OfertaPreco, ResultadoComparador, StatusComparador } from "../types/comparador";

interface OfertaApi {
  titulo: string;
  preco: number;
  loja: string;
  url: string;
  imagem: string | null;
  frete_gratis: boolean;
}

interface ComparadorApi {
  status: StatusComparador;
  fonte: string;
  consulta: string;
  itens: OfertaApi[];
  mais_barato: (OfertaApi & { economia_vs_mediana: number }) | null;
  total_encontrado: number;
  mediana: number | null;
}

function mapearOferta(item: OfertaApi): OfertaPreco {
  return {
    titulo: item.titulo,
    preco: item.preco,
    loja: item.loja,
    url: item.url,
    imagem: item.imagem,
    freteGratis: item.frete_gratis,
  };
}

export function mapearComparador(resposta: ComparadorApi): ResultadoComparador {
  return {
    status: resposta.status,
    fonte: resposta.fonte,
    consulta: resposta.consulta,
    itens: resposta.itens.map(mapearOferta),
    maisBarato: resposta.mais_barato
      ? {
          ...mapearOferta(resposta.mais_barato),
          economiaVsMediana: resposta.mais_barato.economia_vs_mediana,
        }
      : null,
    totalEncontrado: resposta.total_encontrado,
    mediana: resposta.mediana,
  };
}

export const comparadorService = {
  async comparar(consulta: string): Promise<ResultadoComparador> {
    const { data } = await api.get<ComparadorApi>("/conta/comparador", {
      params: { q: consulta },
    });

    return mapearComparador(data);
  },
};
