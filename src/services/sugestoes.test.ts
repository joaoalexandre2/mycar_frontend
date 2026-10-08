import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { mapearSugestao, sugestaoService } from "./sugestoes";

const item = {
  id: 3,
  categoria: "nova_funcao" as const,
  titulo: "Aviso de pneus",
  descricao: "Quero ser avisado ao chegar nos 40 mil km.",
  status: "planejada" as const,
  resposta: "Entra no próximo mês.",
  criada_em: "2026-10-07T12:30:00-03:00",
};

describe("sugestaoService", () => {
  afterEach(() => vi.restoreAllMocks());

  it("converte a sugestão e a data", () => {
    const s = mapearSugestao(item);

    expect(s.criadaEm).toBe("2026-10-07");
    expect(s.resposta).toBe("Entra no próximo mês.");
    expect(s.autor).toBeUndefined();
  });

  it("traz o autor só na visão da equipe", () => {
    const s = mapearSugestao({ ...item, autor: { nome: "Ana", email: "a@x.com", perfil: "pessoa" } });

    expect(s.autor?.perfil).toBe("pessoa");
  });

  it("usa as rotas do usuário e as da equipe", async () => {
    const getSpy = vi.spyOn(api, "get").mockResolvedValue({ data: [item] } as never);
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({ data: item } as never);
    const putSpy = vi.spyOn(api, "put").mockResolvedValueOnce({ data: item } as never);

    await sugestaoService.minhas();
    await sugestaoService.enviar({ categoria: "melhoria", titulo: "Algo bom", descricao: "Descrição boa o bastante." });
    await sugestaoService.todas("planejada");
    await sugestaoService.responder(3, "feita", "Pronto!");

    expect(getSpy).toHaveBeenCalledWith("/sugestoes");
    expect(postSpy).toHaveBeenCalledWith("/sugestoes", expect.objectContaining({ categoria: "melhoria" }));
    expect(getSpy).toHaveBeenCalledWith("/admin/sugestoes", { params: { status: "planejada" } });
    expect(putSpy).toHaveBeenCalledWith("/admin/sugestoes/3", { status: "feita", resposta: "Pronto!" });
  });

  it("converte os anexos e completa os links com o endereço da API", () => {
    const s = mapearSugestao({ ...item, anexos: [{ id: 9, url: "/api/sugestoes/anexos/9?signature=abc" }] });

    expect(s.anexos).toHaveLength(1);
    expect(s.anexos[0].url).toMatch(/^https?:\/\/.+\/api\/sugestoes\/anexos\/9\?signature=abc$/);
    expect(mapearSugestao(item).anexos).toEqual([]); // sem anexos na resposta
  });

  it("envia as imagens como formulário e sem imagens como JSON", async () => {
    const postSpy = vi.spyOn(api, "post").mockResolvedValue({ data: item } as never);
    const dados = { categoria: "problema" as const, titulo: "Erro na tela", descricao: "Descrição longa o bastante." };

    await sugestaoService.enviar(dados);
    await sugestaoService.enviar(dados, [new Blob(["a"], { type: "image/jpeg" }), new Blob(["b"], { type: "image/jpeg" })]);

    expect(postSpy.mock.calls[0]).toEqual(["/sugestoes", dados]);

    const corpo = postSpy.mock.calls[1][1] as FormData;
    expect(corpo).toBeInstanceOf(FormData);
    expect(corpo.get("titulo")).toBe("Erro na tela");
    expect(corpo.getAll("imagens[]")).toHaveLength(2);
  });
});
