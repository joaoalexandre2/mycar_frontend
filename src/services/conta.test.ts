import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { contaService, mapearResumoConta, mapearVeiculoConta } from "./conta";

describe("mapearVeiculoConta", () => {
  it("converte o veículo da API e normaliza campos ausentes", () => {
    const veiculo = mapearVeiculoConta({
      id: 4,
      placa: "ABC1D23",
      marca: "Fiat",
      modelo: "Uno",
      ano: 2018,
      fipe_valor: "60250.50",
      proximo_vencimento_ipva: "2026-03-31",
    });

    expect(veiculo.apelido).toBeNull();
    expect(veiculo.uf).toBeNull();
    expect(veiculo.fipeValor).toBe(60250.5);
    expect(veiculo.proximoVencimentoIpva).toBe("2026-03-31");
    expect(veiculo.proximoVencimentoLicenciamento).toBeNull();
    expect(veiculo.ipvaEstimado).toBeNull();
  });

  it("sem valor FIPE, o valor fica nulo (e não zero)", () => {
    const veiculo = mapearVeiculoConta({
      id: 1,
      placa: "AAA1B11",
      marca: "VW",
      modelo: "Gol",
      ano: 2010,
      fipe_valor: null,
    });

    expect(veiculo.fipeValor).toBeNull();
  });
});

describe("mapearResumoConta", () => {
  it("converte o resumo e os vencimentos", () => {
    const resumo = mapearResumoConta({
      conta: { nome: "Transportes Silva", tipo: "frota" },
      total_veiculos: 3,
      valor_total_fipe: 120000,
      dias_a_frente: 60,
      vencimentos: [
        {
          tipo: "ipva",
          veiculo_id: 9,
          veiculo: "Van",
          placa: "AAA1B23",
          data: "2026-03-31",
          dias: 26,
          valor_estimado: 1600,
        },
      ],
    });

    expect(resumo.nomeConta).toBe("Transportes Silva");
    expect(resumo.tipoConta).toBe("frota");
    expect(resumo.totalVeiculos).toBe(3);
    expect(resumo.vencimentos[0]).toEqual({
      tipo: "ipva",
      veiculoId: 9,
      veiculo: "Van",
      placa: "AAA1B23",
      data: "2026-03-31",
      dias: 26,
      valorEstimado: 1600,
    });
  });
});

describe("contaService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lista os veículos da conta com paginação e busca", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: {
        data: [{ id: 1, placa: "AAA1B11", marca: "Fiat", modelo: "Uno", ano: 2018 }],
        meta: { current_page: 2, last_page: 3, per_page: 10, total: 25 },
        resumo: { total: 25, valorTotalFipe: 99000 },
      },
    } as never);

    const pagina = await contaService.listarVeiculos({
      pagina: 2,
      busca: "uno",
      porPagina: 10,
    });

    expect(getSpy).toHaveBeenCalledWith("/conta/veiculos", {
      params: { page: 2, per_page: 10, busca: "uno" },
    });
    expect(pagina.paginaAtual).toBe(2);
    expect(pagina.totalPaginas).toBe(3);
    expect(pagina.totalRegistros).toBe(25);
    expect(pagina.valorTotalFipe).toBe(99000);
    expect(pagina.dados[0].placa).toBe("AAA1B11");
  });

  it("busca vazia não vai como string vazia", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: {
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
        resumo: { total: 0, valorTotalFipe: 0 },
      },
    } as never);

    await contaService.listarVeiculos({ busca: "", porPagina: 15 });

    expect(getSpy.mock.calls[0][1]).toEqual({
      params: { page: 1, per_page: 15, busca: undefined },
    });
  });

  it("cria, atualiza, remove e consulta a FIPE nas rotas da conta", async () => {
    const veiculo = { id: 7, placa: "AAA1B11", marca: "Fiat", modelo: "Uno", ano: 2018 };
    const postSpy = vi.spyOn(api, "post").mockResolvedValue({ data: veiculo } as never);
    const putSpy = vi.spyOn(api, "put").mockResolvedValue({ data: veiculo } as never);
    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValue({} as never);

    const payload = { placa: "AAA1B11", marca: "Fiat", modelo: "Uno", ano: 2018 };

    await contaService.criarVeiculo(payload);
    await contaService.atualizarVeiculo(7, payload);
    await contaService.removerVeiculo(7);
    await contaService.consultarFipe(7);

    expect(postSpy).toHaveBeenCalledWith("/conta/veiculos", payload);
    expect(putSpy).toHaveBeenCalledWith("/conta/veiculos/7", payload);
    expect(deleteSpy).toHaveBeenCalledWith("/conta/veiculos/7");
    expect(postSpy).toHaveBeenCalledWith("/conta/veiculos/7/fipe");
  });
});
