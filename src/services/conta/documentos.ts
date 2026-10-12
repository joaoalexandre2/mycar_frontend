import api from "../api";
import { dataISO } from "../../utils/formatters";
import type {
  DocumentosDoVeiculo,
  NovoDocumento,
  SituacaoDocumento,
  TipoDocumento,
} from "../../types/conta";

interface DocumentosApi {
  documentos: {
    id: number;
    tipo: TipoDocumento;
    rotulo: string;
    titulo: string | null;
    vencimento: string | null;
    observacoes: string | null;
    dias_para_vencer: number | null;
    situacao: SituacaoDocumento;
  }[];
  crlv: { vencimento: string | null; estimativa_licenciamento: string | null };
}

export function mapearDocumentos(resposta: DocumentosApi): DocumentosDoVeiculo {
  return {
    documentos: resposta.documentos.map((item) => ({
      id: item.id,
      tipo: item.tipo,
      rotulo: item.rotulo,
      titulo: item.titulo,
      vencimento: item.vencimento ? dataISO(item.vencimento) : null,
      observacoes: item.observacoes,
      diasParaVencer: item.dias_para_vencer,
      situacao: item.situacao,
    })),
    crlvVencimento: resposta.crlv.vencimento
      ? dataISO(resposta.crlv.vencimento)
      : null,
    estimativaLicenciamento: resposta.crlv.estimativa_licenciamento
      ? dataISO(resposta.crlv.estimativa_licenciamento)
      : null,
  };
}

export const documentoService = {
  async listar(veiculoId: number): Promise<DocumentosDoVeiculo> {
    const { data } = await api.get<DocumentosApi>(`/conta/veiculos/${veiculoId}/documentos`);
    return mapearDocumentos(data);
  },

  async registrar(veiculoId: number, documento: NovoDocumento): Promise<DocumentosDoVeiculo> {
    const { data } = await api.post<DocumentosApi>(`/conta/veiculos/${veiculoId}/documentos`, documento);
    return mapearDocumentos(data);
  },

  async remover(veiculoId: number, documentoId: number): Promise<DocumentosDoVeiculo> {
    const { data } = await api.delete<DocumentosApi>(`/conta/veiculos/${veiculoId}/documentos/${documentoId}`);
    return mapearDocumentos(data);
  },
};
