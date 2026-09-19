import api from "./api";
import type { LoginPayload, Usuario } from "../types/auth";
import { limparSessao, salvarSessao } from "../utils/authStorage";

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
};
