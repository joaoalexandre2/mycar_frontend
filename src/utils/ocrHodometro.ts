import { createWorker, PSM } from "tesseract.js";

/** Maior km plausível num painel; acima disso é leitura errada. */
const KM_MAXIMO = 9_999_999;

/** Limiares de cinza usados nas duas leituras: o km só vale se as duas derem o mesmo número. */
const LIMIARES = [110, 140] as const;

/** Ampliação e borda branca do recorte: o OCR lê melhor números grandes com respiro em volta. */
const AMPLIACAO = 4;
const MARGEM = 20;

/**
 * Acha o km no texto lido do painel: o maior número com 3 a 7 dígitos (aceita
 * ponto ou espaço de milhar). Chamado só com o visor já recortado.
 */
export function extrairKm(texto: string): number | null {
  const achados = texto.match(/\b\d{1,3}(?:[.\s]\d{3})+\b|\b\d{3,7}\b/g) ?? [];
  const numeros = achados.map((achado) => Number(achado.replace(/\D/g, ""))).filter((n) => n > 0 && n <= KM_MAXIMO);

  return numeros.length > 0 ? Math.max(...numeros) : null;
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

/**
 * Deixa a área em preto e branco: cada pixel vira preto ou branco pela média
 * dos canais RGB. Os dígitos (escuros) ficam pretos; o fundo, branco.
 */
export function limiarizar(dados: Uint8ClampedArray, limiar: number): Uint8ClampedArray<ArrayBuffer> {
  const saida = new Uint8ClampedArray(new ArrayBuffer(dados.length));

  for (let i = 0; i < dados.length; i += 4) {
    const media = (dados[i] + dados[i + 1] + dados[i + 2]) / 3;
    const valor = media < limiar ? 0 : 255;

    saida[i] = saida[i + 1] = saida[i + 2] = valor;
    saida[i + 3] = 255;
  }

  return saida;
}

/** Recorta a área, põe borda branca, amplia e aplica o limiar. Devolve um PNG. */
async function prepararArea(foto: Blob, area: Retangulo, limiar: number): Promise<Blob> {
  const imagem = await createImageBitmap(foto);
  const largura = (area.largura + 2 * MARGEM) * AMPLIACAO;
  const altura = (area.altura + 2 * MARGEM) * AMPLIACAO;
  const canvas = document.createElement("canvas");

  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");

  if (!contexto) throw new Error("Não consegui preparar a foto.");

  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, largura, altura);
  contexto.drawImage(
    imagem,
    area.x,
    area.y,
    area.largura,
    area.altura,
    MARGEM * AMPLIACAO,
    MARGEM * AMPLIACAO,
    area.largura * AMPLIACAO,
    area.altura * AMPLIACAO,
  );
  imagem.close();

  const pixels = contexto.getImageData(0, 0, largura, altura);

  contexto.putImageData(new ImageData(limiarizar(pixels.data, limiar), largura, altura), 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((png) => (png ? resolve(png) : reject(new Error("Não consegui preparar a foto."))), "image/png");
  });
}

/**
 * Lê o km do visor marcado. Faz duas leituras com limiares diferentes e só devolve
 * o número se as duas concordarem; senão devolve null, para o motorista digitar.
 */
export async function lerKmDoVisor(foto: Blob, area: Retangulo): Promise<number | null> {
  const worker = await createWorker("eng");

  try {
    await worker.setParameters({ tessedit_char_whitelist: "0123456789", tessedit_pageseg_mode: PSM.SINGLE_LINE });

    const leituras: (number | null)[] = [];

    for (const limiar of LIMIARES) {
      const { data } = await worker.recognize(await prepararArea(foto, area, limiar));

      leituras.push(extrairKm(data.text));
    }

    const [primeira, segunda] = leituras;

    return primeira !== null && primeira === segunda ? primeira : null;
  } finally {
    await worker.terminate();
  }
}
