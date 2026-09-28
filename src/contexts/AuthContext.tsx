import { useState, type ReactNode } from "react";
import { authService } from "../services/auth";
import { obterUsuarioLogado } from "../utils/authStorage";
import type { LoginPayload, Usuario } from "../types/auth";
import { AuthContext } from "./authContextDefinition";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() =>
    obterUsuarioLogado(),
  );

  async function entrar(payload: LoginPayload) {
    const usuarioLogado = await authService.login(payload);
    setUsuario(usuarioLogado);
  }

  async function sair() {
    await authService.logout();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: Boolean(usuario),
        entrar,
        sair,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
