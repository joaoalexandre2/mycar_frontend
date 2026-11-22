import type { Usuario } from "../types/auth";
import { ehAdministradorOuGestor } from "./permissoes";

/**
 * Situação de um aviso por km. Sem a km do veículo o aviso é "desconhecida":
 * nunca vira "já passou" (antes, `kmRestante ?? 0` transformava o desconhecido
 * em vencido).
 */
export type SituacaoPorKm =
  | { tipo: "desconhecida" }
  | { tipo: "passou"; faltam: number }
  | { tipo: "faltam"; faltam: number };

export function situacaoPorKm(kmRestante: number | null | undefined): SituacaoPorKm {
  if (kmRestante === null || kmRestante === undefined || !Number.isFinite(kmRestante)) {
    return { tipo: "desconhecida" };
  }

  return kmRestante <= 0 ? { tipo: "passou", faltam: kmRestante } : { tipo: "faltam", faltam: kmRestante };
}

const ITENS_DE_TROCA = /^(pneus|bateria|palhetas|filtros|freios|correia)/i;

/** "Pneus" → "a troca de pneus"; "Troca de óleo" → "a troca de óleo"; outro nome → "o serviço X". */
function oQueAcompanhar(rotulo: string | undefined): string {
  const nome = (rotulo ?? "").trim();

  if (!nome) return "este serviço";
  if (/^troca\b/i.test(nome)) return `a ${nome.toLocaleLowerCase("pt-BR")}`;
  if (ITENS_DE_TROCA.test(nome)) return `a troca de ${nome.toLocaleLowerCase("pt-BR")}`;

  return `o serviço "${nome}"`;
}

export function mensagemKmDesconhecida(veiculo: string, rotulo?: string): string {
  return `Informe a km de ${veiculo} para acompanhar ${oQueAcompanhar(rotulo)}`;
}

/**
 * Quem pode informar a km: na frota, só administrador e gestor (o mesmo que
 * libera "informar/corrigir" no cartão do veículo); na conta pessoa, o dono,
 * que informa a km nos abastecimentos e serviços do veículo.
 */
export function podeInformarKm(usuario: Usuario | null | undefined): boolean {
  if (usuario?.perfil === "frota") return ehAdministradorOuGestor(usuario);

  return usuario?.perfil === "pessoa";
}
