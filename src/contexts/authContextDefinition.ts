import { createContext } from "react";
import type { LoginPayload, Usuario } from "../types/auth";

export interface AuthContextValor {
  usuario: Usuario | null;
  autenticado: boolean;
  entrar: (payload: LoginPayload) => Promise<void>;
  sair: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValor | undefined>(
  undefined,
);
