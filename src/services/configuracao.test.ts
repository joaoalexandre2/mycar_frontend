import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { configuracaoService } from "./configuracao";

describe("configuracaoService - dados da oficina", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const dados = {
    nome: "Oficina Teste",
    cnpj: null,
    telefone: "(51) 99999-0000",
    endereco: null,
  };

  it("lê a preferência do resumo semanal junto com os dados da oficina", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { ...dados, resumo_semanal: false },
    } as never);

    const oficina = await configuracaoService.buscarOficina();

    expect(oficina.resumo_semanal).toBe(false);
  });

  it("envia a escolha do resumo semanal ao salvar a oficina", async () => {
    const putSpy = vi.spyOn(api, "put").mockResolvedValueOnce({
      data: { ...dados, resumo_semanal: false },
    } as never);

    await configuracaoService.atualizarOficina({ ...dados, resumo_semanal: false });

    expect(putSpy).toHaveBeenCalledWith("/oficina", {
      ...dados,
      resumo_semanal: false,
    });
  });

  it("aceita respostas antigas, sem o campo (a tela trata como ligado)", async () => {
    vi.spyOn(api, "get").mockResolvedValueOnce({ data: dados } as never);

    const oficina = await configuracaoService.buscarOficina();

    expect(oficina.resumo_semanal).toBeUndefined();
    expect(oficina.resumo_semanal ?? true).toBe(true);
  });
});
