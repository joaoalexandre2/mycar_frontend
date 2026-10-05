import api from "./api";
import type { LoginPayload, RegisterPayload, Usuario } from "../types/auth";
import {
  limparSessao,
  salvarSessao,
  salvarUsuario,
} from "../utils/authStorage";

interface LoginResposta {
  user: Usuario;
  token: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<Usuario> {
    const { data } = await api.post<LoginResposta>("/login", payload);

    salvarSessao(data.token, data.user);

    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/logout");
    } finally {
      limparSessao();
    }
  },

  /**
   * Relê os dados do usuário no servidor e guarda na sessão. É o que faz uma
   * mudança de perfil (ou de nome) valer sem precisar sair e entrar de novo.
   */
  async atualizarSessao(): Promise<Usuario> {
    const { data } = await api.get<Usuario>("/me");

    salvarUsuario(data);

    return data;
  },

  /** Cria a oficina e o usuário administrador. Não faz login automático:
   * o acesso só libera depois de confirmar o e-mail. */
  async registrar(payload: RegisterPayload): Promise<void> {
    await api.post("/register", payload);
  },

  async reenviarConfirmacao(email: string): Promise<void> {
    await api.post("/email/reenviar", { email });
  },

  async esqueciSenha(email: string): Promise<void> {
    await api.post("/password/esqueci", { email });
  },

  async redefinirSenha(payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }): Promise<void> {
    await api.post("/password/redefinir", payload);
  },
};
