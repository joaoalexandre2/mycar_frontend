import { isAxiosError } from "axios";
import api from "./api";
import { urlDaFoto } from "../utils/imagem";
import type {
  CentroCusto,
  CentroCustoPayload,
  ErrosDeImportacao,
  MotivoTrocaCentro,
  PapelDaFrota,
  PessoaDaFrota,
  FiltroAgenda,
  FiltroTrocasDeCentro,
  GrupoUsuario,
  GrupoUsuarioPayload,
  GruposDaFrota,
  Motorista,
  MotoristaPayload,
  ResumoImportacao,
  StatusUso,
  TrocaDeCentro,
  UsoPayload,
  UsuarioDaFrota,
  UsoVeiculo,
} from "../types/frota";

// --------------------------------------------------------------------- motoristas

interface MotoristaApi {
  id: number;
  nome: string;
  telefone?: string | null;
  cnh_numero?: string | null;
  cnh_validade?: string | null;
  ativo: boolean;
  centro_custo_id?: number | null;
}

export function mapearMotorista(item: MotoristaApi): Motorista {
  return {
    id: item.id,
    nome: item.nome,
    telefone: item.telefone ?? null,
    cnhNumero: item.cnh_numero ?? null,
    cnhValidade: item.cnh_validade ? item.cnh_validade.slice(0, 10) : null,
    ativo: Boolean(item.ativo),
    centroCustoId: item.centro_custo_id ?? null,
  };
}

export const motoristasService = {
  async listar(todos = false): Promise<Motorista[]> {
    const { data } = await api.get<MotoristaApi[]>("/conta/motoristas", {
      params: todos ? { todos: 1 } : undefined,
    });

    return data.map(mapearMotorista);
  },

  async criar(payload: MotoristaPayload): Promise<Motorista> {
    const { data } = await api.post<MotoristaApi>("/conta/motoristas", payload);

    return mapearMotorista(data);
  },

  async atualizar(id: number, payload: MotoristaPayload): Promise<Motorista> {
    const { data } = await api.put<MotoristaApi>(`/conta/motoristas/${id}`, payload);

    return mapearMotorista(data);
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/conta/motoristas/${id}`);
  },
};

// ------------------------------------------------------------------ centros de custo

export const centrosCustoService = {
  async listar(todos = false): Promise<CentroCusto[]> {
    const { data } = await api.get<CentroCusto[]>("/conta/centros-custo", {
      params: todos ? { todos: 1 } : undefined,
    });

    return data.map((c) => ({ id: c.id, nome: c.nome, codigo: c.codigo ?? null, ativo: Boolean(c.ativo) }));
  },

  async criar(payload: CentroCustoPayload): Promise<CentroCusto> {
    const { data } = await api.post<CentroCusto>("/conta/centros-custo", payload);

    return { id: data.id, nome: data.nome, codigo: data.codigo ?? null, ativo: Boolean(data.ativo) };
  },

  async atualizar(id: number, payload: CentroCustoPayload): Promise<CentroCusto> {
    const { data } = await api.put<CentroCusto>(`/conta/centros-custo/${id}`, payload);

    return { id: data.id, nome: data.nome, codigo: data.codigo ?? null, ativo: Boolean(data.ativo) };
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/conta/centros-custo/${id}`);
  },

  /** Relatório das trocas de centro de custo, da mais recente para a mais antiga. */
  async trocas(filtro: FiltroTrocasDeCentro = {}): Promise<TrocaDeCentro[]> {
    const { data } = await api.get<TrocaApi[]>("/conta/centros-custo/historico", {
      params: { de: filtro.de || undefined, ate: filtro.ate || undefined, centro_custo_id: filtro.centroCustoId },
    });

    return data.map(mapearTroca);
  },
};

// ------------------------------------------------------- grupos de usuários

interface GrupoApi {
  id: number;
  nome: string;
  descricao: string | null;
  permissoes: string[];
  menus_liberados?: string[];
  membros: UsuarioDaFrota[];
}

function mapearGrupo(g: GrupoApi): GrupoUsuario {
  return {
    id: g.id,
    nome: g.nome,
    descricao: g.descricao ?? null,
    permissoes: g.permissoes ?? [],
    menus_liberados: g.menus_liberados ?? [],
    membros: g.membros ?? [],
  };
}

export const gruposUsuariosService = {
  async listar(): Promise<GruposDaFrota> {
    const { data } = await api.get<{
      grupos: GrupoApi[];
      permissoes: Record<string, string>;
      menus: Record<string, string>;
      usuarios: UsuarioDaFrota[];
    }>("/conta/grupos-usuarios");

    return { grupos: data.grupos.map(mapearGrupo), catalogo: data.permissoes, menus: data.menus, usuarios: data.usuarios };
  },

  async criar(payload: GrupoUsuarioPayload): Promise<GrupoUsuario> {
    const { data } = await api.post<GrupoApi>("/conta/grupos-usuarios", payload);

    return mapearGrupo(data);
  },

  async atualizar(id: number, payload: GrupoUsuarioPayload): Promise<GrupoUsuario> {
    const { data } = await api.put<GrupoApi>(`/conta/grupos-usuarios/${id}`, payload);

    return mapearGrupo(data);
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/conta/grupos-usuarios/${id}`);
  },
};

interface TrocaApi {
  id: number;
  uso_veiculo_id: number | null;
  veiculo_conta_id: number | null;
  de: { id: number | null; nome: string | null };
  para: { id: number | null; nome: string | null };
  usuario: string | null;
  motivo: string | null;
  em: string;
}

function mapearTroca(t: TrocaApi): TrocaDeCentro {
  return {
    id: t.id,
    usoId: t.uso_veiculo_id ?? null,
    veiculoId: t.veiculo_conta_id ?? null,
    de: t.de,
    para: t.para,
    usuario: t.usuario ?? null,
    motivo: t.motivo ?? null,
    em: t.em,
  };
}

// ------------------------------------------------------------------------- usos

export interface UsoApi {
  id: number;
  veiculo_conta_id: number;
  veiculo: { id: number; nome: string; placa: string; km_atual: number | null } | null;
  motorista_id: number | null;
  motorista: string | null;
  centro_custo_id: number | null;
  centro_custo: string | null;
  inicio_previsto: string;
  fim_previsto: string;
  finalidade: string | null;
  status: StatusUso;
  km_saida: number | null;
  km_chegada: number | null;
  km_rodados: number | null;
  saida_em: string | null;
  chegada_em: string | null;
  url_foto_saida: string | null;
  url_foto_chegada: string | null;
  origem: "agenda" | "planilha";
  observacoes: string | null;
}

/**
 * O servidor manda data e hora com fuso ("2026-11-10T08:00:00-03:00"). A agenda é
 * toda em horário local da empresa: guardamos "2026-11-10T08:00", que serve para
 * mostrar e para o campo datetime-local sem converter fuso do navegador.
 */
export function horarioLocal(valor: string | null): string | null {
  if (!valor) return null;

  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(valor);

  return m ? `${m[1]}T${m[2]}` : null;
}

export function mapearUso(item: UsoApi): UsoVeiculo {
  return {
    id: item.id,
    veiculoId: item.veiculo_conta_id,
    veiculo: item.veiculo
      ? { id: item.veiculo.id, nome: item.veiculo.nome, placa: item.veiculo.placa, kmAtual: item.veiculo.km_atual ?? null }
      : null,
    motoristaId: item.motorista_id ?? null,
    motorista: item.motorista ?? null,
    centroCustoId: item.centro_custo_id ?? null,
    centroCusto: item.centro_custo ?? null,
    inicioPrevisto: horarioLocal(item.inicio_previsto) ?? item.inicio_previsto,
    fimPrevisto: horarioLocal(item.fim_previsto) ?? item.fim_previsto,
    finalidade: item.finalidade ?? null,
    status: item.status,
    kmSaida: item.km_saida ?? null,
    kmChegada: item.km_chegada ?? null,
    kmRodados: item.km_rodados ?? null,
    saidaEm: horarioLocal(item.saida_em),
    chegadaEm: horarioLocal(item.chegada_em),
    urlFotoSaida: item.url_foto_saida ? urlDaFoto(item.url_foto_saida) : null,
    urlFotoChegada: item.url_foto_chegada ? urlDaFoto(item.url_foto_chegada) : null,
    origem: item.origem,
    observacoes: item.observacoes ?? null,
  };
}

/** Km e, se houver, a foto do hodômetro (já reduzida no navegador). */
function corpoDeKm(campo: "km_saida" | "km_chegada", km: number, foto?: Blob | null): FormData | Record<string, number> {
  if (!foto) {
    return { [campo]: km };
  }

  const corpo = new FormData();
  corpo.append(campo, String(km));
  corpo.append("foto", foto, "hodometro.jpg");

  return corpo;
}

export const usosService = {
  async listar(filtro: FiltroAgenda): Promise<UsoVeiculo[]> {
    const { data } = await api.get<{ usos: UsoApi[] }>("/conta/usos", {
      params: {
        de: filtro.de,
        ate: filtro.ate,
        veiculo_id: filtro.veiculoId,
        motorista_id: filtro.motoristaId,
      },
    });

    return data.usos.map(mapearUso);
  },

  async criar(payload: UsoPayload): Promise<UsoVeiculo> {
    const { data } = await api.post<UsoApi>("/conta/usos", payload);

    return mapearUso(data);
  },

  async atualizar(id: number, payload: UsoPayload): Promise<UsoVeiculo> {
    const { data } = await api.put<UsoApi>(`/conta/usos/${id}`, payload);

    return mapearUso(data);
  },

  async cancelar(id: number): Promise<UsoVeiculo> {
    const { data } = await api.post<UsoApi>(`/conta/usos/${id}/cancelar`);

    return mapearUso(data);
  },

  async remover(id: number): Promise<void> {
    await api.delete(`/conta/usos/${id}`);
  },

  /** Troca o centro de custo de um uso (mesmo concluído). O anterior fica no histórico, com o motivo escolhido. */
  async trocarCentro(id: number, centroCustoId: number, motivoId: number): Promise<UsoVeiculo> {
    const { data } = await api.put<UsoApi>(`/conta/usos/${id}/centro-custo`, { centro_custo_id: centroCustoId, motivo_id: motivoId });

    return mapearUso(data);
  },

  async historicoDeCentros(id: number): Promise<TrocaDeCentro[]> {
    const { data } = await api.get<TrocaApi[]>(`/conta/usos/${id}/centros-historico`);

    return data.map(mapearTroca);
  },

  async registrarSaida(id: number, km: number, foto?: Blob | null): Promise<UsoVeiculo> {
    const { data } = await api.post<UsoApi>(`/conta/usos/${id}/saida`, corpoDeKm("km_saida", km, foto));

    return mapearUso(data);
  },

  async registrarChegada(id: number, km: number, foto?: Blob | null): Promise<UsoVeiculo> {
    const { data } = await api.post<UsoApi>(`/conta/usos/${id}/chegada`, corpoDeKm("km_chegada", km, foto));

    return mapearUso(data);
  },

  /** Anexa ou troca a foto de um momento já registrado. */
  async anexarFoto(id: number, momento: "saida" | "chegada", foto: Blob): Promise<UsoVeiculo> {
    const corpo = new FormData();
    corpo.append("foto", foto, "hodometro.jpg");

    const { data } = await api.post<UsoApi>(`/conta/usos/${id}/foto/${momento}`, corpo);

    return mapearUso(data);
  },

  /** Corrige o km atual do veículo (o único jeito de ele diminuir). O motivo fica na trilha de auditoria. */
  async corrigirKm(veiculoId: number, km: number, motivo: string): Promise<{ kmAtual: number }> {
    const { data } = await api.put<{ km_atual: number }>(`/conta/veiculos/${veiculoId}/km`, { km, motivo });

    return { kmAtual: data.km_atual };
  },

  /** Planilha-modelo (CSV) para preencher e importar. */
  async baixarModelo(): Promise<Blob> {
    const { data } = await api.get<Blob>("/conta/usos/planilha-modelo", { responseType: "blob" });

    return data;
  },

  /**
   * Importa a planilha. Com `simular`, só confere. Se houver problemas, lança
   * ErrosDeImportacao com a lista de linhas para o usuário corrigir.
   */
  async importar(
    arquivo: File,
    opcoes: { simular?: boolean; criarFaltantes?: boolean } = {},
  ): Promise<ResumoImportacao> {
    const corpo = new FormData();
    corpo.append("arquivo", arquivo);
    if (opcoes.simular) corpo.append("simular", "1");
    if (opcoes.criarFaltantes) corpo.append("criar_faltantes", "1");

    try {
      const { data } = await api.post<{
        usos: number;
        veiculos: number;
        km_rodados: number;
        motoristas_novos: string[];
        centros_novos: string[];
        gravado: boolean;
      }>("/conta/usos/importar", corpo);

      return {
        usos: data.usos,
        veiculos: data.veiculos,
        kmRodados: data.km_rodados,
        motoristasNovos: data.motoristas_novos,
        centrosNovos: data.centros_novos,
        gravado: data.gravado,
      };
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422 && Array.isArray(error.response.data?.erros)) {
        throw new ErroDePlanilha({
          mensagem: String(error.response.data.message ?? "A planilha tem problemas."),
          erros: error.response.data.erros as string[],
          totalDeErros: Number(error.response.data.total_de_erros ?? error.response.data.erros.length),
        });
      }

      throw error;
    }
  },
};

/** Erro de validação da planilha, com as linhas que precisam de correção. */
export class ErroDePlanilha extends Error {
  detalhes: ErrosDeImportacao;

  constructor(detalhes: ErrosDeImportacao) {
    super(detalhes.mensagem);
    this.name = "ErroDePlanilha";
    this.detalhes = detalhes;
  }
}

// ------------------------------------------------------- pessoas e papéis

export const pessoasFrotaService = {
  async listar(): Promise<PessoaDaFrota[]> {
    const { data } = await api.get<PessoaDaFrota[]>("/conta/pessoas");

    return data;
  },

  async convidar(payload: { nome: string; email: string; papel: "administrador" | "gestor" }): Promise<PessoaDaFrota> {
    const { data } = await api.post<PessoaDaFrota>("/conta/pessoas", payload);

    return data;
  },

  async mudarPapel(id: number, papel: PapelDaFrota): Promise<PessoaDaFrota> {
    const { data } = await api.put<PessoaDaFrota>(`/conta/pessoas/${id}/papel`, { papel });

    return data;
  },
};

// ------------------------------------------------------- motivos de troca de centro

export const motivosTrocaCentroService = {
  async listar(todos = false): Promise<MotivoTrocaCentro[]> {
    const { data } = await api.get<MotivoTrocaCentro[]>("/conta/motivos-troca-centro", {
      params: todos ? { todos: 1 } : undefined,
    });

    return data;
  },

  async criar(nome: string): Promise<MotivoTrocaCentro> {
    const { data } = await api.post<MotivoTrocaCentro>("/conta/motivos-troca-centro", { nome });

    return data;
  },

  async atualizar(id: number, dados: { nome?: string; ativo?: boolean }): Promise<MotivoTrocaCentro> {
    const { data } = await api.put<MotivoTrocaCentro>(`/conta/motivos-troca-centro/${id}`, dados);

    return data;
  },
};
