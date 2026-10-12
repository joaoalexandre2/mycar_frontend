import api from "../api";
import { dataISO } from "../../utils/formatters";
import type {
  NovoServico,
  ServicosDaConta,
  SituacaoServico,
} from "../../types/conta";

interface ServicosApi {
  tipos: { tipo: string; rotulo: string }[];
  servicos: {
    id: number;
    veiculo_conta_id: number;
    veiculo: string | null;
    placa: string | null;
    tipo: string;
    rotulo: string;
    titulo: string | null;
    realizado_em: string;
    km: number | null;
    valor: number | string | null;
    observacoes: string | null;
    intervalo_meses: number | null;
    intervalo_km: number | null;
    proximo_em: string | null;
    proxima_km: number | null;
    vigente: boolean;
    km_atual: number | null;
    dias_restantes: number | null;
    km_restante: number | null;
    situacao: SituacaoServico;
  }[];
}

export function mapearServicos(resposta: ServicosApi): ServicosDaConta {
  return {
    tipos: resposta.tipos,
    servicos: resposta.servicos.map((item) => ({
      id: item.id,
      veiculoContaId: item.veiculo_conta_id,
      veiculo: item.veiculo,
      placa: item.placa,
      tipo: item.tipo,
      rotulo: item.rotulo,
      titulo: item.titulo,
      realizadoEm: dataISO(item.realizado_em),
      km: item.km,
      valor: item.valor === null ? null : Number(item.valor),
      observacoes: item.observacoes,
      intervaloMeses: item.intervalo_meses,
      intervaloKm: item.intervalo_km,
      proximoEm: item.proximo_em ? dataISO(item.proximo_em) : null,
      proximaKm: item.proxima_km,
      vigente: item.vigente,
      kmAtual: item.km_atual,
      diasRestantes: item.dias_restantes,
      kmRestante: item.km_restante,
      situacao: item.situacao,
    })),
  };
}

export const servicoService = {
  async listar(): Promise<ServicosDaConta> {
    const { data } = await api.get<ServicosApi>("/conta/servicos");
    return mapearServicos(data);
  },

  async registrar(servico: NovoServico): Promise<ServicosDaConta> {
    const { data } = await api.post<ServicosApi>("/conta/servicos", servico);
    return mapearServicos(data);
  },

  async remover(id: number): Promise<ServicosDaConta> {
    const { data } = await api.delete<ServicosApi>(`/conta/servicos/${id}`);
    return mapearServicos(data);
  },
};
