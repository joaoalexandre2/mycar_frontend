import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { meusMycarsService } from "./meusMycars";
import { obterUsuarioLogado } from "../utils/authStorage";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

const usuarioFrota = { id: 1, name: "Ana", email: "ana@mycar.local", perfil: "frota" as const, conta: "Transportes Silva" };

describe("meusMycarsService", () => {
  it("lista os MyCar e o que ainda dá para criar", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({
      data: {
        user: usuarioFrota,
        mycars: [{ id: "principal", perfil: "oficina", nome: "Oficina da Ana", atual: true }],
        pode_criar: ["pessoa", "frota"],
      },
    } as never);

    const lista = await meusMycarsService.listar();

    expect(get).toHaveBeenCalledWith("/meus-mycars");
    expect(lista.mycars).toHaveLength(1);
    expect(lista.podeCriar).toEqual(["pessoa", "frota"]);
  });

  it("ativar chama a rota do MyCar e guarda o usuário com o perfil novo", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({
      data: { user: usuarioFrota, mycars: [], pode_criar: [] },
    } as never);

    const usuario = await meusMycarsService.ativar("7");

    expect(post).toHaveBeenCalledWith("/meus-mycars/7/ativar");
    expect(usuario.perfil).toBe("frota");
    expect(obterUsuarioLogado()?.perfil).toBe("frota");
  });

  it("voltar ao principal usa o id 'principal'", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({
      data: { user: { ...usuarioFrota, perfil: "oficina" }, mycars: [], pode_criar: [] },
    } as never);

    await meusMycarsService.ativar("principal");

    expect(post).toHaveBeenCalledWith("/meus-mycars/principal/ativar");
    expect(obterUsuarioLogado()?.perfil).toBe("oficina");
  });

  it("criar manda o tipo e o nome e guarda o usuário já dentro do MyCar novo", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({
      data: { user: usuarioFrota, mycars: [], pode_criar: [] },
    } as never);

    await meusMycarsService.criar({ perfil: "frota", nome: "Transportes Silva" });

    expect(post).toHaveBeenCalledWith("/meus-mycars", { perfil: "frota", nome: "Transportes Silva" });
    expect(obterUsuarioLogado()?.conta).toBe("Transportes Silva");
  });
});
