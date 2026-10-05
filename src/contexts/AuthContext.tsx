import { useEffect, useState, type ReactNode } from "react";
import { authService } from "../services/auth";
import { obterToken, obterUsuarioLogado } from "../utils/authStorage";
import type { LoginPayload, Usuario } from "../types/auth";
import { AuthContext } from "./authContextDefinition";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() =>
    obterUsuarioLogado(),
  );

  // Ao abrir o app, relê o usuário no servidor: se o perfil mudou (por
  // exemplo, a conta migrou para outro perfil), o menu acompanha sem exigir
  // novo login. Se falhar, segue com o que está guardado; um token vencido
  // (401) já é tratado pelo interceptor da API.
  useEffect(() => {
    if (!obterToken()) {
      return;
    }

    let ativo = true;

    authService
      .atualizarSessao()
      .then((atualizado) => {
        if (ativo) setUsuario(atualizado);
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, []);

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
        atualizarUsuario: setUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
