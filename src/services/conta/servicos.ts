import api from "../api";
import { dataISO } from "../../utils/formatters";
import type {
  AnexoDoServico,
  NaturezaServico,
  NovoServico,
  ServicosDaConta,
  SituacaoServico,
} from "../../types/conta";

interface AnexoApi {
  id: number;
  nome: string;
  url: string;
}

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
    natureza: NaturezaServico | null;
    oficina: string | null;
    valor_pecas: number | string | null;
    valor_mao_obra: number | string | null;
    pecas: {
      descricao: string;
      quantidade: number | string;
      valor_unitario: number | string;
    }[];
    anexos: AnexoApi[];
  }[];
}

function mapearAnexo(item: AnexoApi): AnexoDoServico {
  return { id: item.id, nome: item.nome, url: item.url };
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
      natureza: item.natureza,
      oficina: item.oficina,
      valorPecas: item.valor_pecas === null ? null : Number(item.valor_pecas),
      valorMaoDeObra: item.valor_mao_obra === null ? null : Number(item.valor_mao_obra),
      pecas: item.pecas.map((peca) => ({
        descricao: peca.descricao,
        quantidade: Number(peca.quantidade),
        valorUnitario: Number(peca.valor_unitario),
      })),
      anexos: item.anexos.map(mapearAnexo),
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

  async atualizar(id: number, servico: NovoServico): Promise<ServicosDaConta> {
    const { data } = await api.put<ServicosApi>(`/conta/servicos/${id}`, servico);
    return mapearServicos(data);
  },

  async remover(id: number): Promise<ServicosDaConta> {
    const { data } = await api.delete<ServicosApi>(`/conta/servicos/${id}`);
    return mapearServicos(data);
  },

  /** Envia a nota fiscal ou recibo do serviço (PDF ou imagem). */
  async anexar(servicoId: number, arquivo: File): Promise<AnexoDoServico> {
    const corpo = new FormData();
    corpo.append("arquivo", arquivo);

    const { data } = await api.post<AnexoApi>(`/conta/servicos/${servicoId}/anexos`, corpo);
    return mapearAnexo(data);
  },

  async removerAnexo(anexoId: number): Promise<void> {
    await api.delete(`/conta/servicos/anexos/${anexoId}`);
  },
};
