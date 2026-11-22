import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import api from "./api";
import { salvarSessao, obterUsuarioLogado } from "../utils/authStorage";
import { haAvisoDeSessaoExpirada } from "../utils/avisoDeSessao";
import type { Usuario } from "../types/auth";

/** Chama a API com um adaptador falso que responde 401 à rota pedida. */
async function chamarCom401(rota: string) {
  await api
    .post(rota, {}, {
      adapter: async (config) => {
        throw new AxiosError("401", "ERR_BAD_REQUEST", config, null, {
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config: config as InternalAxiosRequestConfig,
          data: { message: "Unauthenticated." },
        });
      },
    })
    .catch(() => {});
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  // O jsdom não navega de verdade; o redirecionamento só gera um aviso no console.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe("401 e o aviso de sessão expirada", () => {
  it("com sessão ativa, grava o aviso e limpa a sessão", async () => {
    salvarSessao({ id: 1, name: "Ana", email: "ana@x.com" } as Usuario);

    await chamarCom401("/conta/usos/7/saida");

    expect(haAvisoDeSessaoExpirada()).toBe(true);
    expect(obterUsuarioLogado()).toBeNull();
  });

  it("o aviso é só uma marca: não guarda dados do usuário nem o que foi enviado", async () => {
    salvarSessao({ id: 1, name: "Ana", email: "ana@x.com" } as Usuario);

    await chamarCom401("/conta/usos/7/saida");

    expect(sessionStorage.length).toBe(1);
    expect(Object.values({ ...sessionStorage })).toEqual(["1"]);
  });

  it("login com senha errada (sem sessão) não grava o aviso", async () => {
    await chamarCom401("/login");

    expect(haAvisoDeSessaoExpirada()).toBe(false);
  });

  it("401 do próprio login não vira \"sessão expirou\" mesmo com usuário guardado", async () => {
    salvarSessao({ id: 1, name: "Ana", email: "ana@x.com" } as Usuario);

    await chamarCom401("/login");

    expect(haAvisoDeSessaoExpirada()).toBe(false);
  });

  it("401 de outra rota sem ninguém logado não grava o aviso", async () => {
    await chamarCom401("/conta/usos");

    expect(haAvisoDeSessaoExpirada()).toBe(false);
  });

  it("sessionStorage indisponível não quebra o tratamento do 401", async () => {
    salvarSessao({ id: 1, name: "Ana", email: "ana@x.com" } as Usuario);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    await expect(chamarCom401("/conta/usos")).resolves.toBeUndefined();
    expect(obterUsuarioLogado()).toBeNull();
  });
});
