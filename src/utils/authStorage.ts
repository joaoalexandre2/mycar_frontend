import type { Usuario } from "../types/auth";

const CHAVE_TOKEN = "mycar_token";
const CHAVE_USUARIO = "mycar_usuario";

export function obterToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function salvarSessao(token: string, usuario: Usuario) {
  localStorage.setItem(CHAVE_TOKEN, token);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function obterUsuarioLogado(): Usuario | null {
  const bruto = localStorage.getItem(CHAVE_USUARIO);

  if (!bruto) {
    return null;
  }

  try {
    return JSON.parse(bruto) as Usuario;
  } catch {
    return null;
  }
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
}
