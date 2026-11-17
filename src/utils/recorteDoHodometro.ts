import type { Retangulo } from "./ocrHodometro";

/** Folga em volta da área marcada: a IA lê melhor com um pouco do painel em volta dos dígitos. */
const FOLGA = 0.15;

/** Recorta a área marcada do visor, em cores e com folga, num JPEG para a leitura por IA. */
export async function recortarVisor(foto: Blob, area: Retangulo): Promise<Blob> {
  const imagem = await createImageBitmap(foto);
  const folgaX = Math.round(area.largura * FOLGA);
  const folgaY = Math.round(area.altura * FOLGA);
  const x = Math.max(0, area.x - folgaX);
  const y = Math.max(0, area.y - folgaY);
  const largura = Math.min(imagem.width - x, area.largura + 2 * folgaX);
  const altura = Math.min(imagem.height - y, area.altura + 2 * folgaY);
  const canvas = document.createElement("canvas");

  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");

  if (!contexto) {
    imagem.close();
    throw new Error("Não consegui preparar a foto.");
  }

  contexto.drawImage(imagem, x, y, largura, altura, 0, 0, largura, altura);
  imagem.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((jpeg) => (jpeg ? resolve(jpeg) : reject(new Error("Não consegui preparar a foto."))), "image/jpeg", 0.9);
  });
}
