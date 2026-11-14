import type { Usuario } from "../types/auth";

const CHAVE_USUARIO = "mycar_usuario";

/**
 * Chave usada até a sessão passar a ficar só num cookie HttpOnly. O token não é
 * mais lido nem gravado aqui; esta chave só serve para apagar o token que versões
 * antigas deixaram no aparelho.
 */
const CHAVE_TOKEN_ANTIGO = "mycar_token";

/** Estar logado é ter um usuário guardado. O token fica no cookie, que o JavaScript não lê. */
export function estaLogado(): boolean {
  return obterUsuarioLogado() !== null;
}

export function salvarSessao(usuario: Usuario) {
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
}

export function salvarUsuario(usuario: Usuario) {
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

/** Apaga o token que versões antigas guardaram no aparelho. Pode rodar sempre que o app abre. */
export function apagarTokenAntigo() {
  localStorage.removeItem(CHAVE_TOKEN_ANTIGO);
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_TOKEN_ANTIGO);
  localStorage.removeItem(CHAVE_USUARIO);
}
