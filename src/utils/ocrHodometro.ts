import { createWorker } from "tesseract.js";

/** Maior km plausível num painel; acima disso é leitura errada. */
const KM_MAXIMO = 9_999_999;

/**
 * Acha o km no texto lido do painel: o maior número com 3 a 7 dígitos (aceita
 * ponto ou espaço de milhar). O hodômetro total costuma ser o maior número visível.
 */
export function extrairKm(texto: string): number | null {
  const achados = texto.match(/\b\d{1,3}(?:[.\s]\d{3})+\b|\b\d{3,7}\b/g) ?? [];
  const numeros = achados.map((achado) => Number(achado.replace(/\D/g, ""))).filter((n) => n > 0 && n <= KM_MAXIMO);

  return numeros.length > 0 ? Math.max(...numeros) : null;
}

/** Lê o km da foto do hodômetro no próprio navegador. Devolve null se não achar nada. */
export async function lerKmDaFoto(foto: Blob): Promise<number | null> {
  const worker = await createWorker("eng");

  try {
    await worker.setParameters({ tessedit_char_whitelist: "0123456789." });
    const { data } = await worker.recognize(foto);

    return extrairKm(data.text);
  } finally {
    await worker.terminate();
  }
}

/** Retângulo em pixels da imagem (não da tela). */
export interface Retangulo {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

/**
 * Converte o retângulo desenhado na tela (em pixels da foto exibida) para pixels
 * da foto original, sem sair dos limites dela.
 */
export function paraPixelsDaImagem(
  selecao: Retangulo,
  exibida: { largura: number; altura: number },
  original: { largura: number; altura: number },
): Retangulo {
  const escalaX = original.largura / exibida.largura || 1;
  const escalaY = original.altura / exibida.altura || 1;

  const x = Math.max(0, Math.min(original.largura - 1, Math.round(selecao.x * escalaX)));
  const y = Math.max(0, Math.min(original.altura - 1, Math.round(selecao.y * escalaY)));
  const largura = Math.max(1, Math.min(original.largura - x, Math.round(selecao.largura * escalaX)));
  const altura = Math.max(1, Math.min(original.altura - y, Math.round(selecao.altura * escalaY)));

  return { x, y, largura, altura };
}

/** Recorta a área escolhida da foto e aumenta um pouco, para o OCR ler os dígitos melhor. */
export async function recortarImagem(foto: Blob, area: Retangulo): Promise<Blob> {
  const imagem = await createImageBitmap(foto);
  const ampliacao = 2;
  const canvas = document.createElement("canvas");

  canvas.width = area.largura * ampliacao;
  canvas.height = area.altura * ampliacao;

  const contexto = canvas.getContext("2d");

  if (!contexto) throw new Error("Não consegui recortar a foto.");

  contexto.drawImage(imagem, area.x, area.y, area.largura, area.altura, 0, 0, canvas.width, canvas.height);
  imagem.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob((recorte) => (recorte ? resolve(recorte) : reject(new Error("Não consegui recortar a foto."))), "image/png");
  });
}
