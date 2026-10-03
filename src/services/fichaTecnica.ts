import api from "./api";

export interface FichaTecnicaDados {
  oleo_viscosidade: string | null;
  oleo_especificacao: string | null;
  oleo_capacidade_litros: string | number | null;
  filtro_oleo: string | null;
  filtro_ar: string | null;
  filtro_combustivel: string | null;
  pneu_medida: string | null;
  pneu_pressao_dianteira: number | null;
  pneu_pressao_traseira: number | null;
  observacoes: string | null;
}

export interface FichaTecnica {
  fonte: string | null;
  dados: FichaTecnicaDados | null;
}

export const fichaTecnicaService = {
  async buscar(veiculoId: number): Promise<FichaTecnica> {
    const { data } = await api.get<FichaTecnica>(
      `/veiculos/${veiculoId}/ficha-tecnica`,
    );
    return data;
  },

  async salvar(
    veiculoId: number,
    dados: Record<string, string | number | null>,
  ): Promise<FichaTecnica> {
    const { data } = await api.put<FichaTecnica>(
      `/veiculos/${veiculoId}/ficha-tecnica`,
      dados,
    );
    return data;
  },
};
