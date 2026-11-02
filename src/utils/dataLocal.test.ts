import { afterEach, describe, expect, it, vi } from "vitest";
import { dataISOLocal, hojeISO } from "./formatters";

afterEach(() => vi.useRealTimers());

describe("data local", () => {
  it("à noite no Brasil continua sendo o dia de hoje, não o dia seguinte do UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 2, 22, 30));

    expect(hojeISO()).toBe("2026-11-02");
  });

  it("formata a data passada, com mês e dia de dois dígitos", () => {
    expect(dataISOLocal(new Date(2027, 0, 5, 8, 0))).toBe("2027-01-05");
  });

  it("atravessa a virada de ano", () => {
    expect(dataISOLocal(new Date(2026, 11, 31, 23, 59))).toBe("2026-12-31");
    expect(dataISOLocal(new Date(2027, 0, 1, 0, 1))).toBe("2027-01-01");
  });
});
