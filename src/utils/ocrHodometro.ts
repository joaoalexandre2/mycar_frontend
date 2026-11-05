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
