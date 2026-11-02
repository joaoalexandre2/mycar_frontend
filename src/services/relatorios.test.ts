import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { relatoriosService } from "./relatorios";

afterEach(() => vi.restoreAllMocks());

describe("relatoriosService.mostrar", () => {
  it("converte a resposta da API e manda só os filtros preenchidos", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({
      data: {
        tipo: "consumo",
        titulo: "Consumo médio",
        colunas: [{ chave: "km_por_litro", rotulo: "Km por litro", formato: "numero" }],
        linhas: [{ km_por_litro: 12.5 }],
        total_linhas: 1,
      },
    });

    const resultado = await relatoriosService.mostrar("consumo", { de: "2026-03-01", veiculoId: 4 });

    expect(resultado.totalLinhas).toBe(1);
    expect(resultado.linhas).toEqual([{ km_por_litro: 12.5 }]);
    expect(get).toHaveBeenCalledWith("/conta/relatorios/consumo", {
      params: expect.objectContaining({ de: "2026-03-01", veiculo_id: 4, ate: undefined, motorista_id: undefined }),
    });
  });
});
