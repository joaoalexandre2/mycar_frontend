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
});
