import api from "../api";
import { dataISO } from "../../utils/formatters";
import type {
  CampoFicha,
  FichaTecnicaConta,
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
  dados_modelo: {
    modelo: string;
    fonte: string;
    pagina: string;
    url: string;
    licenca: string;
    coletado_em: string;
    campos: CampoFicha[];
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
    dadosModelo: resposta.dados_modelo
      ? {
          modelo: resposta.dados_modelo.modelo,
          fonte: resposta.dados_modelo.fonte,
          pagina: resposta.dados_modelo.pagina,
          url: resposta.dados_modelo.url,
          licenca: resposta.dados_modelo.licenca,
          coletadoEm: dataISO(resposta.dados_modelo.coletado_em),
          campos: resposta.dados_modelo.campos,
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
