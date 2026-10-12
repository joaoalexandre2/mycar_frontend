import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mensagemErro } from "../services/api";
import { fotoDePerfil, redimensionar, redimensionarVarios } from "./imagem";
import { ErroDeUsuario } from "./erros";

const arquivo = new File(["x"], "foto.jpg", { type: "image/jpeg" });

interface CanvasFalso {
  width: number;
  height: number;
  drawImage: ReturnType<typeof vi.fn>;
}

let canvases: CanvasFalso[];

/** O jsdom não tem canvas: troca por um que só registra o que foi desenhado. */
function simularCanvas() {
  canvases = [];
  const criarOriginal = document.createElement.bind(document);

  vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
    if (tag !== "canvas") return criarOriginal(tag);

    const drawImage = vi.fn();
    const canvas: CanvasFalso & Record<string, unknown> = {
      width: 0,
      height: 0,
      drawImage,
      getContext: () => ({ drawImage }),
      toBlob: (retorno: (blob: Blob | null) => void) => retorno(new Blob(["jpeg"])),
      toDataURL: () => "data:image/jpeg;base64,AAAA",
    };
    canvases.push(canvas);

    return canvas as unknown as HTMLCanvasElement;
  }) as typeof document.createElement);
}

/** <img> falso que "carrega" (ou falha) assim que recebe o src. */
function simularImagem(resultado: "carrega" | "falha", dimensoes = { w: 3000, h: 2000 }) {
  class ImagemFalsa {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = dimensoes.w;
    naturalHeight = dimensoes.h;
    set src(valor: string) {
      if (!valor) return;
      queueMicrotask(() => (resultado === "carrega" ? this.onload?.() : this.onerror?.()));
    }
  }

  vi.stubGlobal("Image", ImagemFalsa);
}

describe("decodificação de imagem", () => {
  beforeEach(() => {
    simularCanvas();
    vi.stubGlobal("URL", Object.assign(URL, {
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("decodifica o arquivo uma vez só para vários tamanhos", async () => {
    const bitmap = { width: 4000, height: 3000, close: vi.fn() };
    const criar = vi.fn().mockResolvedValue(bitmap);
    vi.stubGlobal("createImageBitmap", criar);

    const [foto, miniatura] = await redimensionarVarios(arquivo, [
      { max: 1600, qualidade: 0.82 },
      { max: 400, qualidade: 0.75 },
    ]);

    expect(criar).toHaveBeenCalledTimes(1);
    expect(criar).toHaveBeenCalledWith(arquivo, { imageOrientation: "from-image" });
    expect(foto).toBeInstanceOf(Blob);
    expect(miniatura).toBeInstanceOf(Blob);
    expect(bitmap.close).toHaveBeenCalledTimes(1);
  });

  it("a miniatura sai da versão já reduzida, não da foto original", async () => {
    const bitmap = { width: 4000, height: 3000, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));

    await redimensionarVarios(arquivo, [
      { max: 400, qualidade: 0.75 }, // pedida primeiro, mas processada por último
      { max: 1600, qualidade: 0.82 },
    ]);

    const [grande, pequeno] = canvases;

    expect(grande).toMatchObject({ width: 1600, height: 1200 });
    expect(grande.drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 1600, 1200);

    expect(pequeno).toMatchObject({ width: 400, height: 300 });
    expect(pequeno.drawImage).toHaveBeenCalledWith(grande, 0, 0, 400, 300);
  });

  it("devolve os blobs na ordem em que os tamanhos foram pedidos", async () => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() }),
    );

    const resultado = await redimensionarVarios(arquivo, [
      { max: 400 },
      { max: 1600 },
      { max: 800 },
    ]);

    expect(resultado).toHaveLength(3);
    // Ordem de desenho: 1600, 800, 400; o primeiro pedido (400) é o último desenhado.
    expect(canvases.map((c) => c.width)).toEqual([1600, 800, 400]);
  });

  it("sem createImageBitmap (navegador antigo) lê pelo elemento de imagem", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    simularImagem("carrega");

    const blob = await redimensionar(arquivo, 1600);

    expect(blob).toBeInstanceOf(Blob);
    expect(canvases[0]).toMatchObject({ width: 1600, height: 1067 });
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("se o navegador recusa a opção de orientação, cai para o elemento de imagem", async () => {
    const criar = vi.fn().mockRejectedValue(new TypeError("opção não suportada"));
    vi.stubGlobal("createImageBitmap", criar);
    simularImagem("carrega");

    const blob = await redimensionar(arquivo, 1600);

    expect(criar).toHaveBeenCalledTimes(1);
    expect(blob).toBeInstanceOf(Blob);
  });

  it("imagem ilegível vira uma mensagem clara, não o erro genérico", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("falhou")));
    simularImagem("falha");

    const erro = await redimensionar(arquivo, 1600).catch((e) => e);

    expect(erro).toBeInstanceOf(ErroDeUsuario);
    expect(mensagemErro(erro)).toMatch(/não consegui ler esta imagem/i);
  });

  it("foto de perfil também usa o plano B", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    simularImagem("carrega", { w: 4000, h: 3000 });

    const url = await fotoDePerfil(arquivo);

    expect(url).toMatch(/^data:image\/jpeg/);
    expect(canvases[0]).toMatchObject({ width: 256, height: 256 });
    // recorte quadrado centralizado de 3000x3000, a partir de x=500
    expect(canvases[0].drawImage).toHaveBeenCalledWith(
      expect.anything(),
      500,
      0,
      3000,
      3000,
      0,
      0,
      256,
      256,
    );
  });

  it("libera o bitmap mesmo quando o processamento falha", async () => {
    const bitmap = { width: 4000, height: 3000, close: vi.fn() };
    vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
    vi.spyOn(document, "createElement").mockImplementation((() => {
      throw new Error("sem canvas");
    }) as typeof document.createElement);

    await expect(redimensionar(arquivo, 1600)).rejects.toThrow("sem canvas");

    expect(bitmap.close).toHaveBeenCalledTimes(1);
  });
});
