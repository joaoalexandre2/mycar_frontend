import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import {
  abastecimentoService,
  contaService,
  documentoService,
  mapearDocumentos,
  mapearAbastecimentos,
  mapearResumoConta,
  mapearSeguros,
  seguroService,
  mapearVeiculoConta,
} from "./conta";

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

describe("revisão e preferências da conta", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lê a próxima revisão do veículo e trata ausência como nula", () => {
    const base = { id: 1, placa: "AAA1B11", marca: "Fiat", modelo: "Uno", ano: 2018 };

    expect(
      mapearVeiculoConta({ ...base, revisao_prevista_em: "2026-03-20" }).revisaoPrevistaEm,
    ).toBe("2026-03-20");
    expect(mapearVeiculoConta(base).revisaoPrevistaEm).toBeNull();
  });

  it("aceita revisão entre os vencimentos do resumo", () => {
    const resumo = mapearResumoConta({
      conta: { nome: "Carlos", tipo: "pessoa" },
      total_veiculos: 1,
      valor_total_fipe: 0,
      dias_a_frente: 60,
      vencimentos: [
        { tipo: "revisao", veiculo_id: 1, veiculo: "Uno", placa: "AAA1B11", data: "2026-03-20", dias: -3, valor_estimado: null },
      ],
    });

    expect(resumo.vencimentos[0].tipo).toBe("revisao");
    expect(resumo.vencimentos[0].dias).toBe(-3);
  });

  it("lê e grava a preferência de lembretes por e-mail", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({
      data: { nome: "Carlos", tipo: "pessoa", lembretes_email: false },
    } as never);
    const putSpy = vi.spyOn(api, "put").mockResolvedValueOnce({
      data: { nome: "Carlos", tipo: "pessoa", lembretes_email: true },
    } as never);

    const lida = await contaService.preferencias();
    const salva = await contaService.atualizarPreferencias(true);

    expect(getSpy).toHaveBeenCalledWith("/conta/preferencias");
    expect(lida.lembretesEmail).toBe(false);
    expect(putSpy).toHaveBeenCalledWith("/conta/preferencias", { lembretes_email: true });
    expect(salva.lembretesEmail).toBe(true);
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

describe("abastecimentoService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const resposta = {
    abastecimentos: [
      {
        id: 2,
        data: "2026-05-15",
        km: 10400,
        litros: "40.000",
        valor_total: "240.00",
        tanque_cheio: true,
        combustivel: "gasolina",
        posto: null,
        preco_litro: 6,
        consumo_km_l: 10,
        custo_por_km: 0.6,
      },
    ],
    resumo: {
      consumo_medio_km_l: 10,
      custo_por_km: 0.6,
      total_gasto: 420,
      total_litros: 70,
      preco_medio_litro: 6,
      km_atual: 10400,
      quantidade: 2,
    },
  };

  it("converte litros e valor (que chegam como texto) para número", () => {
    const dados = mapearAbastecimentos(resposta);

    expect(dados.abastecimentos[0].litros).toBe(40);
    expect(dados.abastecimentos[0].valorTotal).toBe(240);
    expect(dados.abastecimentos[0].consumoKmL).toBe(10);
    expect(dados.resumo.consumoMedioKmL).toBe(10);
    expect(dados.resumo.kmAtual).toBe(10400);
  });

  it("lista, registra e remove nas rotas do veículo", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: resposta } as never);
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: resposta } as never);
    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValueOnce({ data: resposta } as never);

    await abastecimentoService.listar(7);
    await abastecimentoService.registrar(7, {
      data: "2026-05-15", km: 10400, litros: 40, valor_total: 240, tanque_cheio: true,
    });
    await abastecimentoService.remover(7, 2);

    expect(getSpy).toHaveBeenCalledWith("/conta/veiculos/7/abastecimentos");
    expect(postSpy).toHaveBeenCalledWith("/conta/veiculos/7/abastecimentos", expect.objectContaining({ km: 10400 }));
    expect(deleteSpy).toHaveBeenCalledWith("/conta/veiculos/7/abastecimentos/2");
  });
});

describe("seguroService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const resposta = {
    seguros: [
      {
        id: 1,
        tipo: "apolice" as const,
        seguradora: "Atual",
        valor_anual: "3000.00",
        franquia: "2500.00",
        vigencia_fim: "2026-06-30",
        observacoes: null,
        valor_mensal: 250,
        vs_referencia_pct: 27.7,
        economia_vs_apolice: null,
      },
      {
        id: 2,
        tipo: "proposta" as const,
        seguradora: "Barata",
        valor_anual: "2400.00",
        franquia: null,
        vigencia_fim: null,
        observacoes: "Compreensiva",
        valor_mensal: 200,
        vs_referencia_pct: 2.1,
        economia_vs_apolice: 600,
      },
    ],
    referencia: { baixo: 1500, medio: 2350, alto: 4000 },
    apolice_atual_id: 1,
    melhor_proposta_id: 2,
    aviso: "Referência, não é cotação.",
  };

  it("converte valores que chegam como texto e mantém a comparação", () => {
    const dados = mapearSeguros(resposta);

    expect(dados.seguros[0].valorAnual).toBe(3000);
    expect(dados.seguros[0].franquia).toBe(2500);
    expect(dados.seguros[1].franquia).toBeNull();
    expect(dados.seguros[1].economiaVsApolice).toBe(600);
    expect(dados.referencia?.medio).toBe(2350);
    expect(dados.apoliceAtualId).toBe(1);
    expect(dados.melhorPropostaId).toBe(2);
  });

  it("aceita resposta sem referência (veículo sem valor FIPE)", () => {
    expect(mapearSeguros({ ...resposta, referencia: null }).referencia).toBeNull();
  });

  it("lista, registra e remove nas rotas do veículo", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: resposta } as never);
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: resposta } as never);
    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValueOnce({ data: resposta } as never);

    await seguroService.listar(7);
    await seguroService.registrar(7, { tipo: "proposta", seguradora: "X", valor_anual: 2400 });
    await seguroService.remover(7, 2);

    expect(getSpy).toHaveBeenCalledWith("/conta/veiculos/7/seguros");
    expect(postSpy).toHaveBeenCalledWith("/conta/veiculos/7/seguros", expect.objectContaining({ tipo: "proposta" }));
    expect(deleteSpy).toHaveBeenCalledWith("/conta/veiculos/7/seguros/2");
  });
});

describe("documentos do veículo", () => {
  const resposta = {
    documentos: [
      {
        id: 1,
        tipo: "crlv" as const,
        rotulo: "CRLV",
        titulo: null,
        vencimento: "2026-03-20",
        observacoes: null,
        dias_para_vencer: 15,
        situacao: "vence_em_breve" as const,
      },
      {
        id: 2,
        tipo: "outro" as const,
        rotulo: "Manual",
        titulo: "Manual",
        vencimento: null,
        observacoes: "na gaveta",
        dias_para_vencer: null,
        situacao: "sem_data" as const,
      },
    ],
    crlv: { vencimento: "2026-03-20", estimativa_licenciamento: "2026-05-31" },
  };

  it("converte documentos, datas e a data real do CRLV", () => {
    const dados = mapearDocumentos(resposta);

    expect(dados.documentos[0].diasParaVencer).toBe(15);
    expect(dados.documentos[0].vencimento).toBe("2026-03-20");
    expect(dados.documentos[1].vencimento).toBeNull();
    expect(dados.crlvVencimento).toBe("2026-03-20");
    expect(dados.estimativaLicenciamento).toBe("2026-05-31");
  });

  it("sem CRLV com data, a data real fica nula", () => {
    const dados = mapearDocumentos({
      documentos: [],
      crlv: { vencimento: null, estimativa_licenciamento: null },
    });

    expect(dados.crlvVencimento).toBeNull();
    expect(dados.estimativaLicenciamento).toBeNull();
  });

  it("lista, registra e remove nas rotas do veículo", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: resposta } as never);
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: resposta } as never);
    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValueOnce({ data: resposta } as never);

    await documentoService.listar(7);
    await documentoService.registrar(7, { tipo: "crlv", vencimento: "2026-03-20" });
    await documentoService.remover(7, 2);

    expect(getSpy).toHaveBeenCalledWith("/conta/veiculos/7/documentos");
    expect(postSpy).toHaveBeenCalledWith("/conta/veiculos/7/documentos", expect.objectContaining({ tipo: "crlv" }));
    expect(deleteSpy).toHaveBeenCalledWith("/conta/veiculos/7/documentos/2");
  });
});
