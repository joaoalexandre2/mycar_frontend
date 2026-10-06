import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  aplicarAparencia,
  aplicarAparenciaSalva,
  salvarAparencia,
} from "../../utils/preferencias";

/** Telas de fora do app: sempre no visual padrão, não importa o tema escolhido. */
const ROTAS_PUBLICAS = [
  "/login",
  "/registrar",
  "/email-confirmado",
  "/esqueci-senha",
  "/redefinir-senha",
];

/**
 * Aplica o tema e a cor gravados na conta do usuário. Fora do app (login,
 * cadastro...) e sem usuário logado, fica no visual padrão (claro, azul).
 */
export function AparenciaDoUsuario() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();

  const publica = ROTAS_PUBLICAS.includes(pathname);
  const tema = usuario?.tema ?? null;
  const cor = usuario?.cor ?? null;

  useEffect(() => {
    if (publica || !usuario) {
      aplicarAparencia("claro", "blue");
    } else if (tema && cor) {
      // Mantém uma cópia local para abrir já no visual certo na próxima vez.
      salvarAparencia(tema, cor);
    } else {
      // Nunca escolheu na conta: vale o que estiver neste navegador.
      aplicarAparenciaSalva();
    }
  }, [publica, usuario, tema, cor]);

  return null;
}
