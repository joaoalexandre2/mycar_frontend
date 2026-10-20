import type { StatusUso, UsoVeiculo } from "../types/frota";

/**
 * Contas de calendário em datas de texto ("2026-11-10"), sem depender do fuso
 * do navegador: a agenda é toda em horário local da empresa.
 */

export interface DiaDoCalendario {
  /** "2026-11-10" */
  data: string;
  /** Falso nos dias de outros meses que completam a grade. */
  doMes: boolean;
}

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** "2026-11-10" a partir do dia UTC de um Date (usado só para somar dias). */
function textoDoDiaUtc(data: Date): string {
  return `${data.getUTCFullYear()}-${doisDigitos(data.getUTCMonth() + 1)}-${doisDigitos(data.getUTCDate())}`;
}

/**
 * Grade do mês com semanas completas, começando no domingo (4 a 6 semanas).
 * `mes` vai de 1 a 12.
 */
export function diasDoCalendario(ano: number, mes: number): DiaDoCalendario[] {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  const ultimo = new Date(Date.UTC(ano, mes, 0));
  const inicio = new Date(primeiro);
  inicio.setUTCDate(primeiro.getUTCDate() - primeiro.getUTCDay());

  const fim = new Date(ultimo);
  fim.setUTCDate(ultimo.getUTCDate() + (6 - ultimo.getUTCDay()));

  const dias: DiaDoCalendario[] = [];

  for (const dia = new Date(inicio); dia <= fim; dia.setUTCDate(dia.getUTCDate() + 1)) {
    dias.push({ data: textoDoDiaUtc(dia), doMes: dia.getUTCMonth() === mes - 1 });
  }

  return dias;
}

/** Primeiro e último dia da grade: é o período que a agenda pede ao servidor. */
export function periodoDaGrade(ano: number, mes: number): { de: string; ate: string } {
  const dias = diasDoCalendario(ano, mes);

  return { de: dias[0].data, ate: dias[dias.length - 1].data };
}

/** Mês anterior (-1) ou seguinte (+1), virando o ano quando preciso. */
export function mesVizinho(ano: number, mes: number, passo: 1 | -1): { ano: number; mes: number } {
  const total = ano * 12 + (mes - 1) + passo;

  return { ano: Math.floor(total / 12), mes: (total % 12) + 1 };
}

export function rotuloDoMes(ano: number, mes: number): string {
  return new Date(Date.UTC(ano, mes - 1, 1)).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** O dia ("2026-11-10") de um horário local ("2026-11-10T08:00"). */
export const diaDe = (horario: string) => horario.slice(0, 10);

/** "08:00" de um horário local. */
export const horaDe = (horario: string) => horario.slice(11, 16);

/** Cancelado não ocupa a agenda. */
export const ocupaAAgenda = (uso: Pick<UsoVeiculo, "status">) => uso.status !== "cancelado";

/** Usos que tocam o dia: começam nele, terminam nele ou o atravessam. */
export function usosDoDia(usos: UsoVeiculo[], dia: string): UsoVeiculo[] {
  return usos
    .filter((u) => ocupaAAgenda(u) && diaDe(u.inicioPrevisto) <= dia && diaDe(u.fimPrevisto) >= dia)
    .sort((a, b) => a.inicioPrevisto.localeCompare(b.inicioPrevisto));
}

/** "10/11 08:00 – 12:00", ou com a data de novo quando o uso passa da meia-noite. */
export function descreverJanela(inicio: string, fim: string): string {
  const diaMes = (h: string) => `${h.slice(8, 10)}/${h.slice(5, 7)}`;

  return diaDe(inicio) === diaDe(fim)
    ? `${diaMes(inicio)} ${horaDe(inicio)} – ${horaDe(fim)}`
    : `${diaMes(inicio)} ${horaDe(inicio)} – ${diaMes(fim)} ${horaDe(fim)}`;
}

/** Para o campo datetime-local: "2026-11-10T08:00". */
export function paraCampoDeHorario(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** Hoje às `hora`:00, no relógio do navegador. */
export function hojeAs(hora: number, agora: Date = new Date()): string {
  const d = new Date(agora);
  d.setHours(hora, 0, 0, 0);

  return paraCampoDeHorario(d);
}

/** Classes de cor de cada situação do uso (calendário e lista). */
export const COR_DO_STATUS: Record<StatusUso, string> = {
  agendado: "border-blue-200 bg-blue-50 text-blue-800",
  em_uso: "border-amber-200 bg-amber-50 text-amber-800",
  concluido: "border-emerald-200 bg-emerald-50 text-emerald-800",
  cancelado: "border-gray-200 bg-gray-50 text-gray-500 line-through",
};
