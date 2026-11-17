import { usosService } from "../services/frota";
import { lerKmDoVisor, type Retangulo } from "./ocrHodometro";
import { recortarVisor } from "./recorteDoHodometro";

/**
 * Lê o km do visor marcado. Primeiro com a IA do servidor; se ela estiver
 * desligada ou fora do ar, cai na leitura feita no próprio navegador.
 * Em qualquer caso o número é só uma sugestão: o motorista confere antes de registrar.
 */
export async function lerKmDoHodometro(foto: Blob, area: Retangulo): Promise<number | null> {
  try {
    return await usosService.lerHodometro(await recortarVisor(foto, area));
  } catch {
    return lerKmDoVisor(foto, area);
  }
}
