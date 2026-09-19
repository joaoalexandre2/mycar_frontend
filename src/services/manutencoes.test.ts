import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { mapearManutencao, manutencoesService } from "./manutencoes";
import { hojeISO } from "../utils/formatters";

function somarDias(iso: string, dias: number): string {
  const data = new Date(`${iso}T00:00:00`);
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

function itemBase(
  sobrescrever: Partial<Parameters<typeof mapearManutencao>[0]> = {},
) {
  return {
    id: 1,
    veiculo_id: 1,
    tipo: "Troca de óleo",
    descricao: null,
    valor: null,
    data_manutencao: hojeISO(),
    quilometragem: null,
    proxima_quilometragem: null,
    proxima_data: null,
    ...sobrescrever,
  };
}

/**
 * statusPorData() não é exportada de manutencoes.ts, então testamos ela
 * indiretamente através de mapearManutencao() — a mesma regra que foi
 * replicada em SQL no backend (ver ManutencaoRepository::aplicarStatus,
 * e tests/Feature/ManutencaoTest.php lá). Se um dia alguém mudar essa
 * regra só de um lado (front ou back), os dois conjuntos de testes vão
 * divergir e apontar exatamente onde.
 */
describe("mapearManutencao - classificação de situação por data", () => {
  const hoje = hojeISO();

  it("sem proxima_data é sempre em_dia", () => {
    expect(mapearManutencao(itemBase({ proxima_data: null })).status).toBe(
      "em_dia",
    );
  });

  it("proxima_data no passado é atrasada", () => {
    const ontem = somarDias(hoje, -1);

    expect(mapearManutencao(itemBase({ proxima_data: ontem })).status).toBe(
      "atrasada",
    );
  });

  it("proxima_data hoje é próxima (limite inferior)", () => {
    expect(mapearManutencao(itemBase({ proxima_data: hoje })).status).toBe(
      "proxima",
    );
  });

  it("proxima_data em exatamente 30 dias ainda é próxima (limite superior)", () => {
    const em30dias = somarDias(hoje, 30);

    expect(
      mapearManutencao(itemBase({ proxima_data: em30dias })).status,
    ).toBe("proxima");
  });

  it("proxima_data em 31 dias já vira em_dia", () => {
    const em31dias = somarDias(hoje, 31);

    expect(
      mapearManutencao(itemBase({ proxima_data: em31dias })).status,
    ).toBe("em_dia");
  });
});

describe("manutencoesService.listarPaginado", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envia os parâmetros certos e mapeia a resposta paginada", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: {
        data: [itemBase()],
        meta: { current_page: 2, last_page: 5, per_page: 10, total: 42 },
        resumo: {
          total: 42,
          emDia: 40,
          proximas: 1,
          atrasadas: 1,
          veiculosMonitorados: 10,
        },
      },
    } as never);

    const resultado = await manutencoesService.listarPaginado({
      pagina: 2,
      busca: "troca",
      status: "atrasada",
      porPagina: 10,
    });

    expect(getSpy).toHaveBeenCalledWith("/manutencoes", {
      params: { page: 2, busca: "troca", status: "atrasada", per_page: 10 },
    });
    expect(resultado.paginaAtual).toBe(2);
    expect(resultado.totalPaginas).toBe(5);
    expect(resultado.totalRegistros).toBe(42);
    expect(resultado.dados).toHaveLength(1);
    expect(resultado.resumo.atrasadas).toBe(1);
  });

  it('busca vazia vira "undefined" no parâmetro, não string vazia', async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        resumo: {
          total: 0,
          emDia: 0,
          proximas: 0,
          atrasadas: 0,
          veiculosMonitorados: 0,
        },
      },
    } as never);

    await manutencoesService.listarPaginado({ busca: "" });

    expect(getSpy).toHaveBeenCalledWith("/manutencoes", {
      params: { page: 1, busca: undefined, status: "todos", per_page: 15 },
    });
  });
});
