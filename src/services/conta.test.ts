import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import {
  abastecimentoService,
  contaService,
  documentoService,
  catalogoPecasService,
  mapearCatalogoPecas,
  codigoPecaService,
  despesaService,
  mapearDespesas,
  mapearServicos,
  servicoService,
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

describe("serviços da conta", () => {
  const resposta = {
    tipos: [{ tipo: "oleo", rotulo: "Troca de óleo" }],
    servicos: [
      {
        id: 1,
        veiculo_conta_id: 7,
        veiculo: "Uno",
        placa: "AAA1B25",
        tipo: "oleo",
        rotulo: "Troca de óleo",
        titulo: null,
        realizado_em: "2026-03-01",
        km: 50000,
        valor: "250.00",
        observacoes: null,
        intervalo_meses: 6,
        intervalo_km: 10000,
        proximo_em: "2026-09-01",
        proxima_km: 60000,
        vigente: true,
        km_atual: 59500,
        dias_restantes: 180,
        km_restante: 500,
        situacao: "vence_em_breve" as const,
      },
    ],
  };

  it("converte valor, datas e os critérios de aviso", () => {
    const [servico] = mapearServicos(resposta).servicos;

    expect(servico.valor).toBe(250);
    expect(servico.proximoEm).toBe("2026-09-01");
    expect(servico.proximaKm).toBe(60000);
    expect(servico.kmRestante).toBe(500);
    expect(servico.situacao).toBe("vence_em_breve");
  });

  it("serviço sem valor nem aviso fica com campos nulos", () => {
    const [servico] = mapearServicos({
      ...resposta,
      servicos: [{ ...resposta.servicos[0], valor: null, proximo_em: null, proxima_km: null }],
    }).servicos;

    expect(servico.valor).toBeNull();
    expect(servico.proximoEm).toBeNull();
    expect(servico.proximaKm).toBeNull();
  });

  it("lista, registra e remove nas rotas da conta", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: resposta } as never);
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: resposta } as never);
    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValueOnce({ data: resposta } as never);

    await servicoService.listar();
    await servicoService.registrar({ veiculo_conta_id: 7, tipo: "oleo", realizado_em: "2026-03-01" });
    await servicoService.remover(1);

    expect(getSpy).toHaveBeenCalledWith("/conta/servicos");
    expect(postSpy).toHaveBeenCalledWith("/conta/servicos", expect.objectContaining({ tipo: "oleo" }));
    expect(deleteSpy).toHaveBeenCalledWith("/conta/servicos/1");
  });
});

describe("despesas da conta", () => {
  const resposta = {
    total: 1300,
    combustivel: {
      total: 550,
      litros: 108.5,
      itens: [{ tipo: "gasolina", rotulo: "Gasolina", total: 400, litros: 68.5, quantidade: 2 }],
    },
    servicos: {
      total: 750,
      itens: [{ tipo: "oleo", rotulo: "Troca de óleo", total: 300, quantidade: 1 }],
    },
    seguro: {
      valor_anual_total: 3000,
      itens: [{ veiculo: "Fiat Uno", seguradora: "Atual", valor_anual: 3000, vigencia_fim: "2026-06-30" }],
    },
    por_veiculo: [
      { veiculo_id: 7, veiculo: "Fiat Uno", placa: "AAA1B25", combustivel: 550, servicos: 750, total: 1300 },
    ],
  };

  it("converte as categorias, o seguro anual e o resumo por veículo", () => {
    const dados = mapearDespesas(resposta);

    expect(dados.total).toBe(1300);
    expect(dados.combustivel.itens[0].rotulo).toBe("Gasolina");
    expect(dados.seguro.valorAnualTotal).toBe(3000);
    expect(dados.seguro.itens[0].vigenciaFim).toBe("2026-06-30");
    expect(dados.porVeiculo[0].veiculoId).toBe(7);
  });

  it("envia só os filtros informados", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValue({ data: resposta } as never);
    getSpy.mockClear();

    await despesaService.listar({ de: "2026-01-01", veiculoId: 7 });
    await despesaService.listar();

    expect(getSpy).toHaveBeenNthCalledWith(1, "/conta/despesas", {
      params: { de: "2026-01-01", ate: undefined, veiculo_id: 7 },
    });
    expect(getSpy).toHaveBeenNthCalledWith(2, "/conta/despesas", {
      params: { de: undefined, ate: undefined, veiculo_id: undefined },
    });
  });
});

describe("catálogo de peças", () => {
  const resposta = {
    veiculo: { id: 7, nome: "Fiat Uno", placa: "AAA1B25" },
    modelo: { nome: "Fiat Uno", categoria: "hatch", categoria_rotulo: "Hatch", original: "Mopar" },
    escopo: "modelo" as const,
    total: 1,
    sistemas: [{ chave: "suspensao", rotulo: "Suspensão", total: 1 }],
    pecas: [
      {
        id: "amortecedor-dianteiro",
        sistema: "suspensao",
        sistema_rotulo: "Suspensão",
        nome: "Amortecedor dianteiro",
        posicao: "dianteiro" as const,
        intervalo_km: 70000,
        observacao: null,
        marcas: ["Cofap", "Monroe"],
        meus_codigos: [{ id: 5, peca_id: "amortecedor-dianteiro", marca: "Cofap", codigo: "GP 123", observacoes: null }],
      },
    ],
    modelos_no_catalogo: 86,
    aviso: "Confirme pelo chassi.",
  };

  it("converte o modelo achado e as peças", () => {
    const dados = mapearCatalogoPecas(resposta);

    expect(dados.modelo).toEqual({ nome: "Fiat Uno", categoriaRotulo: "Hatch", original: "Mopar" });
    expect(dados.pecas[0].marcas).toEqual(["Cofap", "Monroe"]);
    expect(dados.pecas[0].meusCodigos[0]).toEqual({ id: 5, pecaId: "amortecedor-dianteiro", marca: "Cofap", codigo: "GP 123", observacoes: null });
    expect(dados.escopo).toBe("modelo");
    expect(dados.pecas[0].sistemaRotulo).toBe("Suspensão");
    expect(dados.pecas[0].intervaloKm).toBe(70000);
    expect(dados.modelosNoCatalogo).toBe(86);
  });

  it("sem modelo no catálogo, o modelo fica nulo", () => {
    expect(mapearCatalogoPecas({ ...resposta, modelo: null, escopo: "geral" }).modelo).toBeNull();
  });

  it("envia só os filtros informados", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValue({ data: resposta } as never);
    getSpy.mockClear();

    await catalogoPecasService.buscar({ q: "coifa", veiculoId: 7, sistema: "suspensao" });
    await catalogoPecasService.buscar();

    expect(getSpy).toHaveBeenNthCalledWith(1, "/conta/pecas-catalogo", {
      params: { q: "coifa", veiculo_id: 7, sistema: "suspensao" },
    });
    expect(getSpy).toHaveBeenNthCalledWith(2, "/conta/pecas-catalogo", {
      params: { q: undefined, veiculo_id: undefined, sistema: undefined },
    });
  });
});

describe("meu código de peça", () => {
  it("registra e remove nas rotas do veículo", async () => {
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({
      data: { id: 9, peca_id: "bateria", marca: "Moura", codigo: "M60", observacoes: null },
    } as never);
    const deleteSpy = vi.spyOn(api, "delete").mockResolvedValueOnce({ data: {} } as never);

    const codigo = await codigoPecaService.registrar(7, { peca_id: "bateria", marca: "Moura", codigo: "M60" });
    await codigoPecaService.remover(7, 9);

    expect(codigo).toEqual({ id: 9, pecaId: "bateria", marca: "Moura", codigo: "M60", observacoes: null });
    expect(postSpy).toHaveBeenCalledWith("/conta/veiculos/7/codigos-pecas", expect.objectContaining({ peca_id: "bateria" }));
    expect(deleteSpy).toHaveBeenCalledWith("/conta/veiculos/7/codigos-pecas/9");
  });
});

describe("ficha técnica da conta", () => {
  const resposta = {
    veiculo: { id: 7, nome: "Fiat Uno", placa: "AAA1B25", marca: "Fiat", modelo: "Uno 1.0", ano: 2018, uf: null },
    fipe: { codigo_fipe: "001004-9", combustivel: "Gasolina", ano_modelo: 2018, valor: 41000.5, mes_referencia: "outubro de 2026" },
    fipe_status: "ok" as const,
    especificacoes: [{ chave: "motor", rotulo: "Motor (cilindrada)", valor: "1.0 litros" }],
    dados_modelo: {
      modelo: "Fiat Uno", fonte: "Wikipédia", pagina: "Fiat Uno", url: "https://pt.wikipedia.org/wiki/Fiat_Uno",
      licenca: "CC BY-SA 4.0", coletado_em: "2026-10-07", campos: [{ chave: "potencia", rotulo: "Potência", valor: "75 cv" }],
    },
    manutencao: { oleo_viscosidade: "5W30" },
  };

  it("converte a FIPE, os dados do modelo e a manutenção", async () => {
    const { mapearFichaTecnicaConta } = await import("./conta");
    const ficha = mapearFichaTecnicaConta(resposta);

    expect(ficha.fipe?.codigoFipe).toBe("001004-9");
    expect(ficha.fipe?.valor).toBe(41000.5);
    expect(ficha.fipeStatus).toBe("ok");
    expect(ficha.dadosModelo?.licenca).toBe("CC BY-SA 4.0");
    expect(ficha.dadosModelo?.coletadoEm).toBe("2026-10-07");
    expect(ficha.especificacoes[0].valor).toBe("1.0 litros");
    expect(ficha.manutencao?.oleo_viscosidade).toBe("5W30");
  });

  it("sem FIPE nem dados do modelo, vêm nulos", async () => {
    const { mapearFichaTecnicaConta } = await import("./conta");
    const ficha = mapearFichaTecnicaConta({ ...resposta, fipe: null, fipe_status: "sem_codigo" as const, dados_modelo: null, manutencao: null });

    expect(ficha.fipe).toBeNull();
    expect(ficha.dadosModelo).toBeNull();
    expect(ficha.manutencao).toBeNull();
  });

  it("busca e salva nas rotas do veículo", async () => {
    const { fichaTecnicaContaService } = await import("./conta");
    const getSpy = vi.spyOn(api, "get").mockResolvedValueOnce({ data: resposta } as never);
    const putSpy = vi.spyOn(api, "put").mockResolvedValueOnce({ data: resposta } as never);

    await fichaTecnicaContaService.buscar(7);
    await fichaTecnicaContaService.salvar(7, { oleo_viscosidade: "5W30" });

    expect(getSpy).toHaveBeenCalledWith("/conta/veiculos/7/ficha-tecnica");
    expect(putSpy).toHaveBeenCalledWith("/conta/veiculos/7/ficha-tecnica", { oleo_viscosidade: "5W30" });
  });
});
