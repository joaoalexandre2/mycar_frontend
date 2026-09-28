import { beforeEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { limparSessao, salvarSessao } from "../utils/authStorage";
import { authService } from "./auth";
import type { Usuario } from "../types/auth";

// Mock completo do módulo (em vez de vi.spyOn nos exports nomeados):
// garante que a interceptação funciona mesmo com o import nomeado que
// auth.ts usa (`import { salvarSessao, limparSessao } from "..."`),
// sem depender de detalhes de como o Vitest resolve bindings de ESM.
vi.mock("../utils/authStorage", () => ({
  salvarSessao: vi.fn(),
  limparSessao: vi.fn(),
  obterToken: vi.fn(),
  obterUsuarioLogado: vi.fn(),
}));

const usuarioFake: Usuario = {
  id: 1,
  name: "Fulano de Tal",
  email: "fulano@mycar.local",
};

describe("authService.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama POST /login e salva o token e o usuário recebidos", async () => {
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { user: usuarioFake, token: "token-abc" },
    } as never);

    const usuario = await authService.login({
      email: "fulano@mycar.local",
      password: "123456",
    });

    expect(postSpy).toHaveBeenCalledWith("/login", {
      email: "fulano@mycar.local",
      password: "123456",
    });
    expect(salvarSessao).toHaveBeenCalledWith("token-abc", usuarioFake);
    expect(usuario).toEqual(usuarioFake);
  });
});

describe("authService.logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("limpa a sessão local mesmo se a chamada ao backend falhar", async () => {
    // Regra importante: logout tem que "funcionar" no navegador mesmo
    // se o servidor estiver fora do ar, senão o usuário fica preso.
    vi.spyOn(api, "post").mockRejectedValueOnce(new Error("rede fora do ar"));

    await expect(authService.logout()).rejects.toThrow("rede fora do ar");

    expect(limparSessao).toHaveBeenCalledTimes(1);
  });

  it("limpa a sessão local quando o backend responde normalmente", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({ data: {} } as never);

    await authService.logout();

    expect(limparSessao).toHaveBeenCalledTimes(1);
  });
});
