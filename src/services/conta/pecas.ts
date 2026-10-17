import api from "../api";
import type {
  CodigoPeca,
  NovoCodigoPeca,
  CatalogoDePecas,
  FiltroPecas,
} from "../../types/conta";

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
    /** Ausente em servidores que ainda não têm a base de códigos. */
    codigos_catalogo?: {
      fabricante: string;
      codigo: string;
      ano_de: number | null;
      ano_ate: number | null;
      motor: string | null;
      observacao: string | null;
      fonte: string | null;
    }[];
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
      codigosCatalogo: (peca.codigos_catalogo ?? []).map((c) => ({
        fabricante: c.fabricante,
        codigo: c.codigo,
        anoDe: c.ano_de,
        anoAte: c.ano_ate,
        motor: c.motor,
        observacao: c.observacao,
        fonte: c.fonte,
      })),
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
