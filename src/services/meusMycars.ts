import api from "./api";
import type { Perfil, Usuario } from "../types/auth";
import { salvarUsuario } from "../utils/authStorage";

/** Um dos MyCar da pessoa (oficina, pessoa ou frota). */
export interface MeuMycar {
  /** "principal" ou o id do acesso. */
  id: string;
  perfil: Perfil;
  /** Nome da oficina ou da conta. */
  nome: string;
  /** É o que está aberto neste aparelho. */
  atual: boolean;
}

export interface MeusMycars {
  mycars: MeuMycar[];
  /** Tipos que a pessoa ainda não tem e pode criar. */
  podeCriar: Perfil[];
}

interface MeusMycarsApi {
  user: Usuario;
  mycars: MeuMycar[];
  pode_criar: Perfil[];
}

export interface NovoMycar {
  perfil: Perfil;
  /** Nome da oficina ou da empresa; "Cuidados com seu carro" usa o nome da pessoa. */
  nome?: string;
}

export const meusMycarsService = {
  async listar(): Promise<MeusMycars> {
    const { data } = await api.get<MeusMycarsApi>("/meus-mycars");

    return { mycars: data.mycars, podeCriar: data.pode_criar };
  },

  /** Abre outro MyCar neste aparelho e guarda o usuário já com o perfil novo. */
  async ativar(id: string): Promise<Usuario> {
    const { data } = await api.post<MeusMycarsApi>(`/meus-mycars/${id}/ativar`);

    salvarUsuario(data.user);

    return data.user;
  },

  /** Cria mais um MyCar para a pessoa e já abre nele. */
  async criar(novo: NovoMycar): Promise<Usuario> {
    const { data } = await api.post<MeusMycarsApi>("/meus-mycars", novo);

    salvarUsuario(data.user);

    return data.user;
  },
};
