import { describe, expect, it } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import api from "./api";

/**
 * Regressão: o cliente tem "Content-Type: application/json" por padrão, e o axios
 * converte um FormData em JSON quando vê esse cabeçalho, perdendo os arquivos.
 * O upload de fotos (álbum, sugestões) precisa chegar como multipart de verdade.
 */
async function requisicaoEnviada(corpo: unknown): Promise<InternalAxiosRequestConfig> {
  let enviada!: InternalAxiosRequestConfig;

  await api.post("/qualquer-rota", corpo, {
    // Adaptador falso: guarda o que o axios mandaria depois de todas as transformações.
    adapter: async (config) => {
      enviada = config;

      return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    },
  });

  return enviada;
}

describe("envio de arquivos pelo cliente HTTP", () => {
  it("manda o FormData como formulário, com os arquivos, e não como JSON", async () => {
    const corpo = new FormData();
    corpo.append("foto", new Blob(["conteudo"], { type: "image/jpeg" }), "foto.jpg");
    corpo.append("legenda", "Frente");

    const enviada = await requisicaoEnviada(corpo);

    expect(enviada.data).toBeInstanceOf(FormData);
    expect((enviada.data as FormData).get("foto")).toBeInstanceOf(Blob);
    expect(String(enviada.headers.get("Content-Type") ?? "")).not.toContain("application/json");
  });

  it("continua mandando objetos comuns como JSON", async () => {
    const enviada = await requisicaoEnviada({ a: 1 });

    expect(enviada.data).toBe(JSON.stringify({ a: 1 }));
    expect(String(enviada.headers.get("Content-Type"))).toContain("application/json");
  });
});
