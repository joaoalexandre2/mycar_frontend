import api from "../services/api";

/** Cabe a imagem em um quadrado de `max` pixels sem aumentar e sem deformar. */
export function dimensoesRedimensionadas(
  largura: number,
  altura: number,
  max: number,
): { largura: number; altura: number } {
  const maior = Math.max(largura, altura);

  if (maior <= max) {
    return { largura, altura };
  }

  const fator = max / maior;

  return {
    largura: Math.max(1, Math.round(largura * fator)),
    altura: Math.max(1, Math.round(altura * fator)),
  };
}

/** Recorte quadrado centralizado (para foto de perfil). */
export function recorteQuadrado(largura: number, altura: number) {
  const lado = Math.min(largura, altura);

  return { x: Math.floor((largura - lado) / 2), y: Math.floor((altura - lado) / 2), lado };
}

async function carregar(arquivo: File): Promise<ImageBitmap> {
  // "from-image" aplica a rotação do EXIF: foto de celular em pé não sai deitada.
  return createImageBitmap(arquivo, { imageOrientation: "from-image" });
}

function paraBlob(canvas: HTMLCanvasElement, qualidade: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível processar a imagem."))),
      "image/jpeg",
      qualidade,
    );
  });
}

/** Reduz a foto no próprio navegador (JPEG), para subir rápido e caber nos limites do servidor. */
export async function redimensionar(arquivo: File, max: number, qualidade = 0.82): Promise<Blob> {
  const imagem = await carregar(arquivo);
  const { largura, altura } = dimensoesRedimensionadas(imagem.width, imagem.height, max);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  canvas.getContext("2d")?.drawImage(imagem, 0, 0, largura, altura);
  imagem.close();

  return paraBlob(canvas, qualidade);
}

/** Foto de perfil: quadrado de 256 px em data URI (cabe em poucos KB). */
export async function fotoDePerfil(arquivo: File, lado = 256): Promise<string> {
  const imagem = await carregar(arquivo);
  const corte = recorteQuadrado(imagem.width, imagem.height);

  const canvas = document.createElement("canvas");
  canvas.width = lado;
  canvas.height = lado;
  canvas.getContext("2d")?.drawImage(imagem, corte.x, corte.y, corte.lado, corte.lado, 0, 0, lado, lado);
  imagem.close();

  return canvas.toDataURL("image/jpeg", 0.85);
}

/** O backend manda o link da foto sem host (/api/fotos/...): completa com o endereço da API. */
export function urlDaFoto(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const base = String(api.defaults.baseURL ?? "");

  try {
    return `${new URL(base).origin}${url}`;
  } catch {
    return url;
  }
}
