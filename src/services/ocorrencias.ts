import api from "./api";
import { horarioLocal } from "./frota";
import type {
  FiltroDeOcorrencias,
  FotoDeOcorrencia,
  Ocorrencia,
  OcorrenciaPayload,
  ResumoDeOcorrencias,
  StatusDeOcorrencia,
  TipoDeOcorrencia,
} from "../types/ocorrencias";

interface FotoApi {
  id: number;
  momento: "antes" | "depois";
  url: string;
}

interface OcorrenciaApi {
  id: number;
  tipo: TipoDeOcorrencia;
  tipo_rotulo: string;
  status: StatusDeOcorrencia;
  status_rotulo: string;
  data_hora: string;
  local: string | null;
  descricao: string;
  veiculo: { id: number; placa: string } | null;
  motorista: { id: number; nome: string } | null;
  fotos: FotoApi[];
  prejuizo_estimado?: number | null;
  valor_gasto?: number | null;
  despesa_id?: number | null;
}

interface RespostaApi {
  data: OcorrenciaApi[];
  meta: { current_page: number; last_page: number; total: number };
  resumo: {
    total: number;
    abertas: number;
    por_status: Record<StatusDeOcorrencia, number>;
    prejuizo_total?: number;
    gasto_total?: number;
  };
}

const foto = (f: FotoApi): FotoDeOcorrencia => ({ id: f.id, momento: f.momento, url: f.url });

export function mapearOcorrencia(o: OcorrenciaApi): Ocorrencia {
  return {
    id: o.id,
    tipo: o.tipo,
    tipoRotulo: o.tipo_rotulo,
    status: o.status,
    statusRotulo: o.status_rotulo,
    dataHora: o.data_hora,
    local: o.local,
    descricao: o.descricao,
    veiculo: o.veiculo,
    motorista: o.motorista,
    fotos: o.fotos.map(foto),
    prejuizoEstimado: o.prejuizo_estimado ?? null,
    valorGasto: o.valor_gasto ?? null,
    despesaId: o.despesa_id ?? null,
  };
}

function corpo(p: OcorrenciaPayload) {
  return {
    veiculo_conta_id: p.veiculoId,
    tipo: p.tipo,
    data_hora: p.dataHora,
    local: p.local,
    descricao: p.descricao,
    prejuizo_estimado: p.prejuizoEstimado ?? null,
    valor_gasto: p.valorGasto ?? null,
    status: p.status,
  };
}

export const ocorrenciasService = {
  async listar(pagina = 1, filtro: FiltroDeOcorrencias = {}) {
    const { data } = await api.get<RespostaApi>("/conta/ocorrencias", {
      params: {
        page: pagina,
        tipo: filtro.tipo || undefined,
        status: filtro.status || undefined,
        veiculo_id: filtro.veiculoId || undefined,
      },
    });

    const resumo: ResumoDeOcorrencias = {
      total: data.resumo.total,
      abertas: data.resumo.abertas,
      porStatus: data.resumo.por_status,
      prejuizoTotal: data.resumo.prejuizo_total ?? null,
      gastoTotal: data.resumo.gasto_total ?? null,
    };

    return {
      dados: data.data.map(mapearOcorrencia),
      paginaAtual: data.meta.current_page,
      totalPaginas: data.meta.last_page,
      totalRegistros: data.meta.total,
      resumo,
    };
  },

  /** Data e hora para o campo de formulário, já no horário de Brasília. */
  horarioDoCampo: (dataHora: string) => horarioLocal(dataHora) ?? "",

  async criar(payload: OcorrenciaPayload): Promise<Ocorrencia> {
    const { data } = await api.post<OcorrenciaApi>("/conta/ocorrencias", corpo(payload));

    return mapearOcorrencia(data);
  },

  async atualizar(id: number, payload: OcorrenciaPayload): Promise<Ocorrencia> {
    const { data } = await api.put<OcorrenciaApi>(`/conta/ocorrencias/${id}`, corpo(payload));

    return mapearOcorrencia(data);
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/conta/ocorrencias/${id}`);
  },

  async enviarFoto(id: number, momento: "antes" | "depois", arquivo: Blob): Promise<FotoDeOcorrencia> {
    const corpoDoEnvio = new FormData();
    corpoDoEnvio.append("momento", momento);
    corpoDoEnvio.append("arquivo", arquivo, "foto.jpg");

    const { data } = await api.post<FotoApi>(`/conta/ocorrencias/${id}/fotos`, corpoDoEnvio);

    return foto(data);
  },

  async removerFoto(fotoId: number): Promise<void> {
    await api.delete(`/conta/ocorrencias/fotos/${fotoId}`);
  },
};
