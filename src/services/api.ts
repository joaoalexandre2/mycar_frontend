import axios, { isAxiosError } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export function mensagemErro(error: unknown) {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | {
          message?: string;
          errors?: Record<string, string[] | string>;
        }
      | undefined;

    if (data?.errors) {
      return Object.values(data.errors)
        .flat()
        .join("\n");
    }

    if (data?.message) {
      return data.message;
    }

    if (error.code === "ERR_NETWORK") {
      return "Não foi possível conectar ao backend. Confira se o Laravel está rodando em http://localhost:8000.";
    }
  }

  return "Não foi possível concluir a operação.";
}

export default api;
