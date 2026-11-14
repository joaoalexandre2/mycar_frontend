import { beforeEach, describe, expect, it } from "vitest";
import {
  apagarTokenAntigo,
  estaLogado,
  limparSessao,
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

  it("não está logado antes de qualquer login", () => {
    expect(estaLogado()).toBe(false);
    expect(obterUsuarioLogado()).toBeNull();
  });

  it("salvarSessao grava só o usuário, e a pessoa fica logada", () => {
    salvarSessao(usuarioFake);

    expect(estaLogado()).toBe(true);
    expect(obterUsuarioLogado()).toEqual(usuarioFake);
  });

  it("nunca grava o token no aparelho", () => {
    salvarSessao(usuarioFake);

    const guardado = Object.keys(localStorage).map((chave) => localStorage.getItem(chave) ?? "");
    expect(guardado.join(" ")).not.toContain("token");
  });

  it("limparSessao remove o usuário e o token antigo, se existir", () => {
    salvarSessao(usuarioFake);
    localStorage.setItem("mycar_token", "token-de-uma-versao-antiga");

    limparSessao();

    expect(estaLogado()).toBe(false);
    expect(localStorage.getItem("mycar_token")).toBeNull();
  });

  it("apagarTokenAntigo tira o token guardado por versões antigas e mantém a sessão", () => {
    salvarSessao(usuarioFake);
    localStorage.setItem("mycar_token", "token-de-uma-versao-antiga");

    apagarTokenAntigo();

    expect(localStorage.getItem("mycar_token")).toBeNull();
    expect(estaLogado()).toBe(true);
  });

  it("obterUsuarioLogado não quebra se o valor salvo estiver corrompido", () => {
    // Simula um localStorage de uma versão antiga do app, ou um valor
    // adulterado manualmente — não pode derrubar a aplicação inteira.
    localStorage.setItem("mycar_usuario", "isso não é um JSON válido {{{");

    expect(obterUsuarioLogado()).toBeNull();
  });
});
