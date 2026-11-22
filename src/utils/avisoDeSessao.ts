/**
 * Aviso de "sessão expirou" que atravessa o recarregamento da página até a tela
 * de login. Guarda só uma marca ("1"): nada do que a pessoa digitou (km, foto,
 * motivo) nem o token vai para o armazenamento por causa disso.
 *
 * O sessionStorage pode falhar (navegação privada, cota cheia, bloqueado pelo
 * navegador); nesse caso o aviso simplesmente não aparece, e o login segue normal.
 */
const CHAVE = "mycar_sessao_expirou";

export function gravarAvisoDeSessaoExpirada() {
  try {
    sessionStorage.setItem(CHAVE, "1");
  } catch {
    // Sem armazenamento: o login abre sem o aviso.
  }
}

export function haAvisoDeSessaoExpirada(): boolean {
  try {
    return sessionStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

/** Apaga o aviso depois de lido: ele aparece uma vez só. */
export function apagarAvisoDeSessaoExpirada() {
  try {
    sessionStorage.removeItem(CHAVE);
  } catch {
    // Nada a fazer.
  }
}
