import api from "./api";
import { salvarUsuario } from "../utils/authStorage";
import type { Usuario } from "../types/auth";

export interface DadosOficina {
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
}

export interface AlterarSenhaPayload {
  senha_atual: string;
  password: string;
  password_confirmation: string;
}

export const configuracaoService = {
  async atualizarPerfil(name: string): Promise<Usuario> {
    const { data } = await api.put<Usuario>("/me", { name });
    salvarUsuario(data);
    return data;
  },

  async alterarSenha(payload: AlterarSenhaPayload): Promise<void> {
    await api.put("/me/senha", payload);
  },

  async buscarOficina(): Promise<DadosOficina> {
    const { data } = await api.get<DadosOficina>("/oficina");
    return data;
  },

  async atualizarOficina(dados: DadosOficina): Promise<DadosOficina> {
    const { data } = await api.put<DadosOficina>("/oficina", dados);
    return data;
  },
};
