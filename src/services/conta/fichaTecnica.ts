import api from "../api";
import { dataISO } from "../../utils/formatters";
import type {
  CampoFicha,
  FichaTecnicaConta,
  GrupoDaFicha,
  ManutencaoFicha,
} from "../../types/conta";

interface FichaTecnicaContaApi {
  veiculo: FichaTecnicaConta["veiculo"];
  fipe: {
    codigo_fipe: string | null;
    combustivel: string | null;
    ano_modelo: number | null;
    valor: number | null;
    mes_referencia: string | null;
  } | null;
  fipe_status: "ok" | "sem_codigo" | "indisponivel";
  especificacoes: CampoFicha[];
  dados_catalogo: {
    marca: string;
    modelo: string;
    fonte: string;
    url: string;
    versao: string;
    ano: number;
    coletado_em: string;
    grupos: GrupoDaFicha[];
  } | null;
  manutencao: ManutencaoFicha | null;
}

export function mapearFichaTecnicaConta(resposta: FichaTecnicaContaApi): FichaTecnicaConta {
  return {
    veiculo: resposta.veiculo,
    fipe: resposta.fipe
      ? {
          codigoFipe: resposta.fipe.codigo_fipe,
          combustivel: resposta.fipe.combustivel,
          anoModelo: resposta.fipe.ano_modelo,
          valor: resposta.fipe.valor,
          mesReferencia: resposta.fipe.mes_referencia,
        }
      : null,
    fipeStatus: resposta.fipe_status,
    especificacoes: resposta.especificacoes,
    dadosCatalogo: resposta.dados_catalogo
      ? {
          marca: resposta.dados_catalogo.marca,
          modelo: resposta.dados_catalogo.modelo,
          fonte: resposta.dados_catalogo.fonte,
          url: resposta.dados_catalogo.url,
          versao: resposta.dados_catalogo.versao,
          ano: resposta.dados_catalogo.ano,
          coletadoEm: dataISO(resposta.dados_catalogo.coletado_em),
          grupos: resposta.dados_catalogo.grupos,
        }
      : null,
    manutencao: resposta.manutencao,
  };
}

export const fichaTecnicaContaService = {
  async buscar(veiculoId: number): Promise<FichaTecnicaConta> {
    const { data } = await api.get<FichaTecnicaContaApi>(
      `/conta/veiculos/${veiculoId}/ficha-tecnica`,
    );

    return mapearFichaTecnicaConta(data);
  },

  async salvar(
    veiculoId: number,
    dados: Record<string, string | number | null>,
  ): Promise<FichaTecnicaConta> {
    const { data } = await api.put<FichaTecnicaContaApi>(
      `/conta/veiculos/${veiculoId}/ficha-tecnica`,
      dados,
    );

    return mapearFichaTecnicaConta(data);
  },
};
