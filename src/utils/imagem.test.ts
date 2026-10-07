import { describe, expect, it } from "vitest";
import { dimensoesRedimensionadas, recorteQuadrado, urlDaFoto } from "./imagem";

describe("imagem", () => {
  it("reduz mantendo a proporção e sem passar do limite", () => {
    expect(dimensoesRedimensionadas(4000, 3000, 1600)).toEqual({ largura: 1600, altura: 1200 });
    expect(dimensoesRedimensionadas(3000, 4000, 1600)).toEqual({ largura: 1200, altura: 1600 });
  });

  it("não aumenta imagem que já cabe", () => {
    expect(dimensoesRedimensionadas(800, 600, 1600)).toEqual({ largura: 800, altura: 600 });
    expect(dimensoesRedimensionadas(1600, 1600, 1600)).toEqual({ largura: 1600, altura: 1600 });
  });

  it("nunca devolve dimensão zero", () => {
    expect(dimensoesRedimensionadas(10000, 1, 100)).toEqual({ largura: 100, altura: 1 });
  });

  it("recorta um quadrado centralizado", () => {
    expect(recorteQuadrado(4000, 3000)).toEqual({ x: 500, y: 0, lado: 3000 });
    expect(recorteQuadrado(3000, 4000)).toEqual({ x: 0, y: 500, lado: 3000 });
    expect(recorteQuadrado(500, 500)).toEqual({ x: 0, y: 0, lado: 500 });
  });

  it("completa o link da foto com o endereço da API", () => {
    expect(urlDaFoto("/api/fotos/3/foto?signature=abc")).toMatch(/^https?:\/\/[^/]+\/api\/fotos\/3\/foto\?signature=abc$/);
    expect(urlDaFoto("https://cdn.exemplo.com/a.jpg")).toBe("https://cdn.exemplo.com/a.jpg");
  });
});
