import { describe, expect, it } from "vitest";
import {
  descreverJanela,
  diasDoCalendario,
  hojeAs,
  mesVizinho,
  paraCampoDeHorario,
  periodoDaGrade,
  rotuloDoMes,
  usosDoDia,
} from "./agenda";
import type { UsoVeiculo } from "../types/frota";

function uso(id: number, inicio: string, fim: string, status: UsoVeiculo["status"] = "agendado"): UsoVeiculo {
  return {
    id,
    veiculoId: 1,
    veiculo: null,
    motoristaId: null,
    motorista: null,
    centroCustoId: null,
    centroCusto: null,
    inicioPrevisto: inicio,
    fimPrevisto: fim,
    finalidade: null,
    status,
    kmSaida: null,
    kmChegada: null,
    kmRodados: null,
    saidaEm: null,
    chegadaEm: null,
    urlFotoSaida: null,
    urlFotoChegada: null,
    origem: "agenda",
    observacoes: null,
  };
}

describe("diasDoCalendario", () => {
  it("monta semanas completas começando no domingo", () => {
    // Novembro de 2026 começa em um domingo (01/11) e termina em uma segunda (30/11).
    const dias = diasDoCalendario(2026, 11);

    expect(dias[0]).toEqual({ data: "2026-11-01", doMes: true });
    expect(dias).toHaveLength(35);
    expect(dias.at(-1)).toEqual({ data: "2026-12-05", doMes: false });
    expect(dias.length % 7).toBe(0);
  });

  it("completa a grade com dias do mês anterior e do seguinte", () => {
    // Outubro de 2026: começa em uma quinta (01/10) e termina em uma sábado (31/10).
    const dias = diasDoCalendario(2026, 10);

    expect(dias[0]).toEqual({ data: "2026-09-27", doMes: false });
    expect(dias.filter((d) => d.doMes)).toHaveLength(31);
    expect(dias.at(-1)).toEqual({ data: "2026-10-31", doMes: true });
  });

  it("vira o ano e respeita o ano bissexto", () => {
    expect(diasDoCalendario(2026, 12).at(-1)?.data).toBe("2027-01-02");
    expect(diasDoCalendario(2028, 2).filter((d) => d.doMes)).toHaveLength(29);
    expect(diasDoCalendario(2027, 2).filter((d) => d.doMes)).toHaveLength(28);
  });

  it("o período da grade é o primeiro e o último dia exibidos", () => {
    expect(periodoDaGrade(2026, 10)).toEqual({ de: "2026-09-27", ate: "2026-10-31" });
  });
});

describe("mesVizinho e rotuloDoMes", () => {
  it("passa de dezembro para janeiro e de janeiro para dezembro", () => {
    expect(mesVizinho(2026, 12, 1)).toEqual({ ano: 2027, mes: 1 });
    expect(mesVizinho(2026, 1, -1)).toEqual({ ano: 2025, mes: 12 });
    expect(mesVizinho(2026, 6, 1)).toEqual({ ano: 2026, mes: 7 });
  });

  it("escreve o mês em português", () => {
    expect(rotuloDoMes(2026, 11)).toBe("novembro de 2026");
  });
});

describe("usosDoDia", () => {
  const usos = [
    uso(1, "2026-11-10T08:00", "2026-11-10T12:00"),
    uso(2, "2026-11-09T22:00", "2026-11-11T06:00"), // atravessa o dia 10
    uso(3, "2026-11-10T07:00", "2026-11-10T09:00", "cancelado"),
    uso(4, "2026-11-11T08:00", "2026-11-11T09:00"),
  ];

  it("traz os que começam, terminam ou atravessam o dia, em ordem de horário", () => {
    expect(usosDoDia(usos, "2026-11-10").map((u) => u.id)).toEqual([2, 1]);
    expect(usosDoDia(usos, "2026-11-11").map((u) => u.id)).toEqual([2, 4]);
    expect(usosDoDia(usos, "2026-11-09").map((u) => u.id)).toEqual([2]);
  });

  it("não mostra uso cancelado nem dia sem uso", () => {
    expect(usosDoDia(usos, "2026-11-10").some((u) => u.id === 3)).toBe(false);
    expect(usosDoDia(usos, "2026-11-20")).toEqual([]);
  });
});

describe("descreverJanela e campos de horário", () => {
  it("mostra a data uma vez no mesmo dia e duas quando passa da meia-noite", () => {
    expect(descreverJanela("2026-11-10T08:00", "2026-11-10T12:30")).toBe("10/11 08:00 – 12:30");
    expect(descreverJanela("2026-11-10T22:00", "2026-11-11T06:00")).toBe("10/11 22:00 – 11/11 06:00");
  });

  it("gera o valor do campo datetime-local no relógio local", () => {
    expect(paraCampoDeHorario(new Date(2026, 10, 5, 7, 5))).toBe("2026-11-05T07:05");
    expect(hojeAs(18, new Date(2026, 10, 5, 9, 41))).toBe("2026-11-05T18:00");
  });
});
