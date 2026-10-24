import { describe, expect, it } from "vitest";
import {
  descreverJanela,
  diasDoCalendario,
  fimAoMudarInicio,
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

describe("fimAoMudarInicio", () => {
  it("mudou o dia do início: o fim vai junto, com a mesma hora", () => {
    expect(fimAoMudarInicio("2026-10-26T08:00", "2026-10-28T08:00", "2026-10-26T18:00")).toBe("2026-10-28T18:00");
    expect(fimAoMudarInicio("2026-10-26T08:00", "2026-10-25T08:00", "2026-10-26T18:00")).toBe("2026-10-25T18:00");
  });

  it("reserva de vários dias continua com a mesma duração em dias", () => {
    expect(fimAoMudarInicio("2026-10-26T08:00", "2026-11-02T08:00", "2026-10-29T17:00")).toBe("2026-11-05T17:00");
  });

  it("atravessa mês e ano sem errar", () => {
    expect(fimAoMudarInicio("2026-12-30T08:00", "2027-01-02T08:00", "2026-12-31T18:00")).toBe("2027-01-03T18:00");
    expect(fimAoMudarInicio("2028-02-27T08:00", "2028-03-01T08:00", "2028-02-27T18:00")).toBe("2028-03-01T18:00");
  });

  it("mudou só a hora e o fim continua depois: não mexe", () => {
    expect(fimAoMudarInicio("2026-10-26T08:00", "2026-10-26T10:30", "2026-10-26T18:00")).toBe("2026-10-26T18:00");
  });

  it("início passou do fim no mesmo dia: o fim vira 18:00, ou uma hora depois se já é tarde", () => {
    expect(fimAoMudarInicio("2026-10-26T08:00", "2026-10-26T18:00", "2026-10-26T12:00")).toBe("2026-10-26T19:00");
    expect(fimAoMudarInicio("2026-10-26T08:00", "2026-10-26T23:30", "2026-10-26T18:00")).toBe("2026-10-27T00:30");
    expect(fimAoMudarInicio("2026-10-26T08:00", "2026-10-26T14:00", "2026-10-26T10:00")).toBe("2026-10-26T18:00");
  });

  it("fim vazio ou antes do início vira o fim do dia do início", () => {
    expect(fimAoMudarInicio("2026-10-26T08:00", "2026-10-27T08:00", "")).toBe("2026-10-27T18:00");
    expect(fimAoMudarInicio("", "2026-10-27T08:00", "2026-10-20T18:00")).toBe("2026-10-27T18:00");
  });

  it("início apagado ou incompleto não altera o fim", () => {
    expect(fimAoMudarInicio("2026-10-26T08:00", "", "2026-10-26T18:00")).toBe("2026-10-26T18:00");
    expect(fimAoMudarInicio("2026-10-26T08:00", "2026-10-2", "2026-10-26T18:00")).toBe("2026-10-26T18:00");
  });

  it("digitar o ano aos poucos (0002, 0020, 0202, 2026) termina com o fim no lugar certo", () => {
    let inicio = "2026-10-26T08:00";
    let fim = "2026-10-26T18:00";

    for (const novo of ["0002-10-26T08:00", "0020-10-26T08:00", "0202-10-26T08:00", "2026-10-26T08:00"]) {
      fim = fimAoMudarInicio(inicio, novo, fim);
      inicio = novo;
    }

    expect(fim).toBe("2026-10-26T18:00");
  });
});
