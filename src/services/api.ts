import axios, { isAxiosError } from "axios";
import { limparSessao, obterToken } from "../utils/authStorage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = obterToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Envio de arquivos (FormData): sem o Content-Type fixo em JSON, o axios manda o
  // formulário de verdade e o navegador acrescenta o "boundary". Com ele, o FormData
  // seria convertido em JSON e os arquivos se perderiam.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    config.headers.delete("Content-Type");
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      limparSessao();

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

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
