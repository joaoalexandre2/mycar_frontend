import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { fotosVeiculoService, mapearAlbum } from "./fotos";

const resposta = {
  limite: 30,
  fotos: [
    {
      id: 1,
      legenda: "Frente",
      criada_em: "2026-10-08T10:00:00-03:00",
      url: "/api/fotos/1/foto?signature=a",
      url_miniatura: "/api/fotos/1/miniatura?signature=b",
    },
  ],
};

describe("fotosVeiculoService", () => {
  afterEach(() => vi.restoreAllMocks());

  it("converte o álbum e completa os links com o endereço da API", () => {
    const album = mapearAlbum(resposta);

    expect(album.limite).toBe(30);
    expect(album.fotos[0].criadaEm).toBe("2026-10-08");
    expect(album.fotos[0].url).toMatch(/^https?:\/\/.+\/api\/fotos\/1\/foto\?signature=a$/);
    expect(album.fotos[0].urlMiniatura).toContain("/miniatura?signature=b");
  });

  it("envia foto e miniatura como formulário", async () => {
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: resposta } as never);

    await fotosVeiculoService.enviar(
      7,
      new Blob(["a"], { type: "image/jpeg" }),
      new Blob(["b"], { type: "image/jpeg" }),
      "Frente",
    );

    const [rota, corpo] = postSpy.mock.calls[0] as [string, FormData];
    expect(rota).toBe("/conta/veiculos/7/fotos");
    expect(corpo).toBeInstanceOf(FormData);
    expect(corpo.get("legenda")).toBe("Frente");
    expect(corpo.get("foto")).toBeInstanceOf(Blob);
    expect(corpo.get("miniatura")).toBeInstanceOf(Blob);
  });

  it("lista e remove nas rotas do veículo", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: resposta } as never);
    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValueOnce({ data: resposta } as never);

    await fotosVeiculoService.listar(7);
    await fotosVeiculoService.remover(7, 1);

    expect(getSpy).toHaveBeenCalledWith("/conta/veiculos/7/fotos");
    expect(deleteSpy).toHaveBeenCalledWith("/conta/veiculos/7/fotos/1");
  });
});
