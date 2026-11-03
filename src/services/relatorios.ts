import api from "./api";

export interface CatalogoDeRelatorio {
  tipo: string;
  nome: string;
  descricao: string;
}

export type FormatoDeColuna = "texto" | "inteiro" | "numero" | "moeda" | "data";

export interface ColunaDeRelatorio {
  chave: string;
  rotulo: string;
  formato: FormatoDeColuna;
}

export type CelulaDeRelatorio = string | number | null;

export interface RelatorioGerado {
  tipo: string;
  titulo: string;
  colunas: ColunaDeRelatorio[];
  linhas: Record<string, CelulaDeRelatorio>[];
  totalLinhas: number;
}

export interface FiltroDeRelatorio {
  de?: string;
  ate?: string;
  veiculoId?: number;
  motoristaId?: number;
  centroCustoId?: number;
  categoriaId?: number;
}

function parametros(filtro: FiltroDeRelatorio) {
  return {
    de: filtro.de || undefined,
    ate: filtro.ate || undefined,
    veiculo_id: filtro.veiculoId || undefined,
    motorista_id: filtro.motoristaId || undefined,
    centro_custo_id: filtro.centroCustoId || undefined,
    categoria_id: filtro.categoriaId || undefined,
  };
}

export const relatoriosService = {
  async catalogo(): Promise<CatalogoDeRelatorio[]> {
    const { data } = await api.get<CatalogoDeRelatorio[]>("/conta/relatorios");

    return data;
  },

  async mostrar(tipo: string, filtro: FiltroDeRelatorio = {}): Promise<RelatorioGerado> {
    const { data } = await api.get<{
      tipo: string;
      titulo: string;
      colunas: ColunaDeRelatorio[];
      linhas: Record<string, CelulaDeRelatorio>[];
      total_linhas: number;
    }>(`/conta/relatorios/${tipo}`, { params: parametros(filtro) });

    return {
      tipo: data.tipo,
      titulo: data.titulo,
      colunas: data.colunas,
      linhas: data.linhas,
      totalLinhas: data.total_linhas,
    };
  },

  /** Baixa o CSV (para o Excel) com o mesmo filtro da tela. O link precisa do token, então vai pelo cliente HTTP. */
  async baixarCsv(tipo: string, filtro: FiltroDeRelatorio = {}): Promise<void> {
    const { data, headers } = await api.get<Blob>(`/conta/relatorios/${tipo}/csv`, {
      params: parametros(filtro),
      responseType: "blob",
    });

    const nome = /filename="?([^";]+)"?/.exec(headers["content-disposition"] ?? "")?.[1] ?? `relatorio-${tipo}.csv`;
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");

    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
