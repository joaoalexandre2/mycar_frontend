import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { ErroDePlanilha, horarioLocal, mapearMotorista, mapearUso, usosService, type UsoApi } from "./frota";

const usoApi: UsoApi = {
  id: 7,
  veiculo_conta_id: 3,
  veiculo: { id: 3, nome: "Strada Adventure", placa: "AAA1B25", km_atual: 45310 },
  motorista_id: 2,
  motorista: "Maria Silva",
  centro_custo_id: 5,
  centro_custo: "Entregas",
  inicio_previsto: "2026-11-10T08:00:00-03:00",
  fim_previsto: "2026-11-10T12:00:00-03:00",
  finalidade: "Visita a clientes",
  status: "concluido",
  km_saida: 45200,
  km_chegada: 45310,
  km_rodados: 110,
  saida_em: "2026-11-10T08:05:00-03:00",
  chegada_em: "2026-11-10T11:50:00-03:00",
  url_foto_saida: "https://api.exemplo.com/api/hodometros/7/saida?signature=abc",
  url_foto_chegada: null,
  origem: "agenda",
  observacoes: null,
};

describe("horarioLocal", () => {
  it("guarda o horário como está escrito, sem converter o fuso do navegador", () => {
    expect(horarioLocal("2026-11-10T08:00:00-03:00")).toBe("2026-11-10T08:00");
    expect(horarioLocal("2026-11-10 23:59:00")).toBe("2026-11-10T23:59");
    expect(horarioLocal(null)).toBeNull();
    expect(horarioLocal("lixo")).toBeNull();
  });
});

describe("mapearUso e mapearMotorista", () => {
  it("converte o uso para camelCase com horários locais", () => {
    const uso = mapearUso(usoApi);

    expect(uso.inicioPrevisto).toBe("2026-11-10T08:00");
    expect(uso.fimPrevisto).toBe("2026-11-10T12:00");
    expect(uso.saidaEm).toBe("2026-11-10T08:05");
    expect(uso.kmRodados).toBe(110);
    expect(uso.veiculo).toEqual({ id: 3, nome: "Strada Adventure", placa: "AAA1B25", kmAtual: 45310 });
    expect(uso.urlFotoSaida).toBe("https://api.exemplo.com/api/hodometros/7/saida?signature=abc");
    expect(uso.urlFotoChegada).toBeNull();
  });

  it("completa com o endereço da API o link de foto que vem sem host", () => {
    const uso = mapearUso({ ...usoApi, url_foto_saida: "/api/hodometros/7/saida?signature=abc" });

    expect(uso.urlFotoSaida).toMatch(/^https?:\/\/.+\/api\/hodometros\/7\/saida\?signature=abc$/);
  });

  it("aceita campos opcionais ausentes", () => {
    const uso = mapearUso({ ...usoApi, motorista_id: null, motorista: null, veiculo: null, km_atual: undefined } as unknown as UsoApi);

    expect(uso.motorista).toBeNull();
    expect(uso.veiculo).toBeNull();
  });

  it("corta a data da validade da CNH", () => {
    const m = mapearMotorista({ id: 1, nome: "João", cnh_validade: "2028-05-01T00:00:00.000000Z", ativo: true });

    expect(m.cnhValidade).toBe("2028-05-01");
    expect(m.telefone).toBeNull();
  });
});

describe("usosService: saída e chegada", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sem foto manda só o km, em JSON", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: usoApi } as never);

    await usosService.registrarSaida(7, 45200);

    expect(post).toHaveBeenCalledWith("/conta/usos/7/saida", { km_saida: 45200 });
  });

  it("com foto manda um formulário com o km e o arquivo", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: usoApi } as never);
    const foto = new Blob(["x"], { type: "image/jpeg" });

    await usosService.registrarChegada(7, 45310, foto);

    const [url, corpo] = post.mock.calls[0];
    expect(url).toBe("/conta/usos/7/chegada");
    expect(corpo).toBeInstanceOf(FormData);
    expect((corpo as FormData).get("km_chegada")).toBe("45310");
    expect((corpo as FormData).get("foto")).toBeInstanceOf(Blob);
  });

  it("anexa a foto de um momento já registrado", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: usoApi } as never);

    await usosService.anexarFoto(7, "saida", new Blob(["x"], { type: "image/jpeg" }));

    expect(post.mock.calls[0][0]).toBe("/conta/usos/7/foto/saida");
    expect(post.mock.calls[0][1]).toBeInstanceOf(FormData);
  });

  it("corrige o km do veículo", async () => {
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: { km_atual: 8500 } } as never);

    await expect(usosService.corrigirKm(3, 8500, "Digitado errado")).resolves.toEqual({ kmAtual: 8500 });
    expect(put).toHaveBeenCalledWith("/conta/veiculos/3/km", { km: 8500, motivo: "Digitado errado" });
  });

  it("lista a agenda do período com os filtros", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: { usos: [usoApi] } } as never);

    const usos = await usosService.listar({ de: "2026-11-01", ate: "2026-11-30", veiculoId: 3 });

    expect(usos).toHaveLength(1);
    expect(get).toHaveBeenCalledWith("/conta/usos", {
      params: { de: "2026-11-01", ate: "2026-11-30", veiculo_id: 3, motorista_id: undefined },
    });
  });
});

describe("usosService.importar", () => {
  afterEach(() => vi.restoreAllMocks());

  const arquivo = () => new File(["placa;data_saida"], "uso.csv", { type: "text/csv" });

  it("manda o arquivo com as opções e converte o resumo", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({
      data: { usos: 2, veiculos: 1, km_rodados: 200, motoristas_novos: ["Pedro"], centros_novos: [], gravado: false },
    } as never);

    const resumo = await usosService.importar(arquivo(), { simular: true, criarFaltantes: true });

    expect(resumo).toEqual({ usos: 2, veiculos: 1, kmRodados: 200, motoristasNovos: ["Pedro"], centrosNovos: [], gravado: false });

    const corpo = post.mock.calls[0][1] as FormData;
    expect(post.mock.calls[0][0]).toBe("/conta/usos/importar");
    expect(corpo.get("simular")).toBe("1");
    expect(corpo.get("criar_faltantes")).toBe("1");
    expect((corpo.get("arquivo") as File).name).toBe("uso.csv");
  });

  it("não manda as opções desligadas", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({
      data: { usos: 0, veiculos: 0, km_rodados: 0, motoristas_novos: [], centros_novos: [], gravado: true },
    } as never);

    await usosService.importar(arquivo());

    const corpo = post.mock.calls[0][1] as FormData;
    expect(corpo.has("simular")).toBe(false);
    expect(corpo.has("criar_faltantes")).toBe(false);
  });

  it("transforma a resposta 422 com a lista de linhas em ErroDePlanilha", async () => {
    const erro = Object.assign(new Error("422"), {
      isAxiosError: true,
      response: {
        status: 422,
        data: { message: "2 problema(s) na planilha. Nada foi importado.", erros: ["linha 3: placa X", "linha 4: km"], total_de_erros: 2 },
      },
    });
    vi.spyOn(api, "post").mockRejectedValue(erro);

    const resultado = await usosService.importar(arquivo()).catch((e) => e);

    expect(resultado).toBeInstanceOf(ErroDePlanilha);
    expect((resultado as ErroDePlanilha).detalhes.erros).toEqual(["linha 3: placa X", "linha 4: km"]);
    expect((resultado as ErroDePlanilha).detalhes.totalDeErros).toBe(2);
  });

  it("deixa passar os outros erros sem disfarçar", async () => {
    const falha = new Error("rede caiu");
    vi.spyOn(api, "post").mockRejectedValue(falha);

    await expect(usosService.importar(arquivo())).rejects.toBe(falha);
  });
});
