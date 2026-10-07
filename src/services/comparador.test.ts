import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { comparadorService, mapearComparador } from "./comparador";

const resposta = {
  status: "ok" as const,
  fonte: "Mercado Livre",
  consulta: "pneu 185/65 R15",
  itens: [
    { titulo: "Pneu A", preco: 389.9, loja: "LOJA1", url: "https://ml/1", imagem: null, frete_gratis: true },
    { titulo: "Pneu B", preco: 399, loja: "LOJA2", url: "https://ml/2", imagem: "https://i/2.jpg", frete_gratis: false },
  ],
  mais_barato: { titulo: "Pneu A", preco: 389.9, loja: "LOJA1", url: "https://ml/1", imagem: null, frete_gratis: true, economia_vs_mediana: 25.1 },
  total_encontrado: 6,
  mediana: 415,
};

describe("comparadorService", () => {
  afterEach(() => vi.restoreAllMocks());

  it("converte as ofertas e o mais barato", () => {
    const r = mapearComparador(resposta);

    expect(r.itens[0].freteGratis).toBe(true);
    expect(r.maisBarato?.economiaVsMediana).toBe(25.1);
    expect(r.maisBarato?.loja).toBe("LOJA1");
    expect(r.totalEncontrado).toBe(6);
  });

  it("sem ofertas, o mais barato fica nulo", () => {
    const r = mapearComparador({ ...resposta, status: "sem_resultados" as const, itens: [], mais_barato: null, total_encontrado: 0, mediana: null });

    expect(r.maisBarato).toBeNull();
    expect(r.mediana).toBeNull();
  });

  it("envia a consulta como parâmetro q", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: resposta } as never);

    await comparadorService.comparar("pneu 185/65 R15");

    expect(getSpy).toHaveBeenCalledWith("/conta/comparador", { params: { q: "pneu 185/65 R15" } });
  });
});
