import { beforeEach, describe, expect, it } from "vitest";
import {
  limparSessao,
  obterToken,
  obterUsuarioLogado,
  salvarSessao,
} from "./authStorage";
import type { Usuario } from "../types/auth";

const usuarioFake: Usuario = {
  id: 1,
  name: "Fulano de Tal",
  email: "fulano@mycar.local",
};

describe("authStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("não tem token nem usuário antes de qualquer login", () => {
    expect(obterToken()).toBeNull();
    expect(obterUsuarioLogado()).toBeNull();
  });

  it("salvarSessao grava o token e o usuário para leitura posterior", () => {
    salvarSessao("token-123", usuarioFake);

    expect(obterToken()).toBe("token-123");
    expect(obterUsuarioLogado()).toEqual(usuarioFake);
  });

  it("limparSessao remove o token e o usuário salvos", () => {
    salvarSessao("token-123", usuarioFake);

    limparSessao();

    expect(obterToken()).toBeNull();
    expect(obterUsuarioLogado()).toBeNull();
  });

  it("obterUsuarioLogado não quebra se o valor salvo estiver corrompido", () => {
    // Simula um localStorage de uma versão antiga do app, ou um valor
    // adulterado manualmente — não pode derrubar a aplicação inteira.
    localStorage.setItem("mycar_usuario", "isso não é um JSON válido {{{");

    expect(obterUsuarioLogado()).toBeNull();
  });
});
