import api from "../services/api";
import { ErroDeUsuario } from "./erros";

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

const MENSAGEM_ILEGIVEL =
  "Não consegui ler esta imagem. Tente outra foto (de preferência JPEG ou PNG).";

/** Uma imagem já decodificada, de qualquer um dos dois caminhos. */
interface ImagemDecodificada {
  fonte: CanvasImageSource;
  largura: number;
  altura: number;
  /** Libera a memória (bitmap ou link temporário). */
  liberar: () => void;
}

async function viaBitmap(arquivo: File): Promise<ImagemDecodificada> {
  // "from-image" aplica a rotação do EXIF: foto de celular em pé não sai deitada.
  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });

  return {
    fonte: bitmap,
    largura: bitmap.width,
    altura: bitmap.height,
    liberar: () => bitmap.close(),
  };
}

/**
 * Plano B: o navegador não tem createImageBitmap, ou não aceita a opção de
 * orientação (Safari mais antigo). Um <img> também respeita o EXIF ao desenhar
 * no canvas nos navegadores atuais.
 */
function viaElemento(arquivo: File): Promise<ImagemDecodificada> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => {
      if (!imagem.naturalWidth || !imagem.naturalHeight) {
        URL.revokeObjectURL(url);
        reject(new Error("imagem vazia"));
        return;
      }

      resolve({
        fonte: imagem,
        largura: imagem.naturalWidth,
        altura: imagem.naturalHeight,
        liberar: () => {
          URL.revokeObjectURL(url);
          imagem.src = "";
        },
      });
    };

    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("não foi possível decodificar"));
    };

    imagem.src = url;
  });
}

async function carregar(arquivo: File): Promise<ImagemDecodificada> {
  if (typeof createImageBitmap === "function") {
    try {
      return await viaBitmap(arquivo);
    } catch {
      // Opção não suportada ou formato que o bitmap não lê: tenta pelo <img>.
    }
  }

  try {
    return await viaElemento(arquivo);
  } catch {
    throw new ErroDeUsuario(MENSAGEM_ILEGIVEL);
  }
}

function novoCanvas(largura: number, altura: number) {
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new ErroDeUsuario(
      "Seu navegador não conseguiu processar a imagem. Tente em outro navegador.",
    );
  }

  return { canvas, contexto };
}

function paraBlob(canvas: HTMLCanvasElement, qualidade: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ErroDeUsuario(MENSAGEM_ILEGIVEL))),
      "image/jpeg",
      qualidade,
    );
  });
}

export interface TamanhoDeImagem {
  /** Maior lado, em pixels. */
  max: number;
  qualidade?: number;
}

/**
 * Reduz a foto no próprio navegador (JPEG) para vários tamanhos, decodificando
 * o arquivo UMA vez (uma foto de 12 MP ocupa ~48 MB descompactada: decodificar
 * duas vezes em paralelo pesa no celular). Do maior para o menor, cada versão
 * sai da anterior, que já é pequena.
 *
 * Devolve os blobs na mesma ordem de `tamanhos`.
 */
export async function redimensionarVarios(
  arquivo: File,
  tamanhos: TamanhoDeImagem[],
): Promise<Blob[]> {
  const imagem = await carregar(arquivo);

  try {
    const ordem = tamanhos
      .map((tamanho, indice) => ({ ...tamanho, indice }))
      .sort((a, b) => b.max - a.max);
    const resultado: Blob[] = new Array(tamanhos.length);

    let origem: { fonte: CanvasImageSource; largura: number; altura: number } = imagem;

    for (const tamanho of ordem) {
      const { largura, altura } = dimensoesRedimensionadas(
        origem.largura,
        origem.altura,
        tamanho.max,
      );
      const { canvas, contexto } = novoCanvas(largura, altura);

      contexto.drawImage(origem.fonte, 0, 0, largura, altura);
      resultado[tamanho.indice] = await paraBlob(canvas, tamanho.qualidade ?? 0.82);
      origem = { fonte: canvas, largura, altura };
    }

    return resultado;
  } finally {
    imagem.liberar();
  }
}

/** Reduz a foto no próprio navegador (JPEG), para subir rápido e caber nos limites do servidor. */
export async function redimensionar(arquivo: File, max: number, qualidade = 0.82): Promise<Blob> {
  const [blob] = await redimensionarVarios(arquivo, [{ max, qualidade }]);

  return blob;
}

/** Foto de perfil: quadrado de 256 px em data URI (cabe em poucos KB). */
export async function fotoDePerfil(arquivo: File, lado = 256): Promise<string> {
  const imagem = await carregar(arquivo);

  try {
    const corte = recorteQuadrado(imagem.largura, imagem.altura);
    const { canvas, contexto } = novoCanvas(lado, lado);

    contexto.drawImage(imagem.fonte, corte.x, corte.y, corte.lado, corte.lado, 0, 0, lado, lado);

    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    imagem.liberar();
  }
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
