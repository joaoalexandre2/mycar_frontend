import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SeletorDeMycar } from "./SeletorDeMycar";
import { meusMycarsService, type MeusMycars } from "../../services/meusMycars";
import type { Usuario } from "../../types/auth";

afterEach(() => vi.restoreAllMocks());

const usuario = (perfil: Usuario["perfil"]): Usuario => ({ id: 1, name: "Ana", email: "ana@mycar.local", perfil });

const DOIS: MeusMycars = {
  mycars: [
    { id: "principal", perfil: "oficina", nome: "Oficina da Ana", atual: true },
    { id: "7", perfil: "frota", nome: "Transportes Silva", atual: false },
  ],
  podeCriar: ["pessoa"],
};

function montar(perfil: "oficina" | "pessoa" | "frota" = "oficina", aoTrocar = vi.fn()) {
  render(<SeletorDeMycar perfil={perfil} aoTrocar={aoTrocar} />);

  return aoTrocar;
}

describe("SeletorDeMycar", () => {
  it("mostra o nome curto do MyCar aberto em cada perfil", () => {
    const { unmount } = render(<SeletorDeMycar perfil="oficina" aoTrocar={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Oficina/ })).toBeInTheDocument();
    unmount();

    render(<SeletorDeMycar perfil="pessoa" aoTrocar={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Cuidados com seu carro/ })).toBeInTheDocument();
  });

  it("ao abrir, lista os MyCar da pessoa e marca o que está aberto", async () => {
    vi.spyOn(meusMycarsService, "listar").mockResolvedValue(DOIS);
    montar();

    await userEvent.click(screen.getByRole("button", { name: /Oficina/ }));

    const lista = await screen.findByRole("listbox", { name: "Seus MyCar" });
    const opcoes = await within(lista).findAllByRole("option");

    expect(opcoes).toHaveLength(2);
    expect(opcoes[0]).toHaveAttribute("aria-selected", "true");
    expect(opcoes[0]).toHaveTextContent("Oficina da Ana");
    expect(opcoes[1]).toHaveAttribute("aria-selected", "false");
    expect(opcoes[1]).toHaveTextContent("Transportes Silva");
  });

  it("escolher outro MyCar abre ele e recomeça a tela", async () => {
    vi.spyOn(meusMycarsService, "listar").mockResolvedValue(DOIS);
    const ativar = vi.spyOn(meusMycarsService, "ativar").mockResolvedValue(usuario("frota"));
    const aoTrocar = montar();

    await userEvent.click(screen.getByRole("button", { name: /Oficina/ }));
    await userEvent.click(await screen.findByRole("option", { name: /Transportes Silva/ }));

    await waitFor(() => expect(aoTrocar).toHaveBeenCalledTimes(1));
    expect(ativar).toHaveBeenCalledWith("7");
  });

  it("clicar no MyCar que já está aberto só fecha a lista", async () => {
    vi.spyOn(meusMycarsService, "listar").mockResolvedValue(DOIS);
    const ativar = vi.spyOn(meusMycarsService, "ativar");
    const aoTrocar = montar();

    await userEvent.click(screen.getByRole("button", { name: /Oficina/ }));
    await userEvent.click(await screen.findByRole("option", { name: /Oficina da Ana/ }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(ativar).not.toHaveBeenCalled();
    expect(aoTrocar).not.toHaveBeenCalled();
  });

  it("só oferece 'Adicionar outro MyCar' enquanto falta algum tipo", async () => {
    vi.spyOn(meusMycarsService, "listar").mockResolvedValue({
      mycars: DOIS.mycars,
      podeCriar: [],
    });
    montar();

    await userEvent.click(screen.getByRole("button", { name: /Oficina/ }));
    await screen.findAllByRole("option");

    expect(screen.queryByRole("button", { name: /Adicionar outro MyCar/ })).not.toBeInTheDocument();
  });

  it("adiciona outro MyCar: pessoa não pede nome e a frota pede o nome da empresa", async () => {
    vi.spyOn(meusMycarsService, "listar").mockResolvedValue({ mycars: [DOIS.mycars[0]], podeCriar: ["pessoa", "frota"] });
    const criar = vi.spyOn(meusMycarsService, "criar").mockResolvedValue(usuario("frota"));
    const aoTrocar = montar();

    await userEvent.click(screen.getByRole("button", { name: /Oficina/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Adicionar outro MyCar/ }));

    const dialogo = await screen.findByRole("dialog");
    // O primeiro tipo da lista (Cuidados com seu carro) não precisa de nome.
    expect(within(dialogo).queryByLabelText("Nome da empresa")).not.toBeInTheDocument();

    await userEvent.click(within(dialogo).getByRole("radio", { name: /MyCar Frota/ }));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Criar e abrir" }));
    expect(await within(dialogo).findByRole("alert")).toHaveTextContent("Informe o nome da empresa");
    expect(criar).not.toHaveBeenCalled();

    await userEvent.type(within(dialogo).getByLabelText("Nome da empresa"), "  Transportes Silva ");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Criar e abrir" }));

    await waitFor(() => expect(criar).toHaveBeenCalledWith({ perfil: "frota", nome: "Transportes Silva" }));
    expect(aoTrocar).toHaveBeenCalledTimes(1);
  });

  it("cria o Cuidados com seu carro sem enviar nome", async () => {
    vi.spyOn(meusMycarsService, "listar").mockResolvedValue({ mycars: [DOIS.mycars[0]], podeCriar: ["pessoa"] });
    const criar = vi.spyOn(meusMycarsService, "criar").mockResolvedValue(usuario("pessoa"));
    montar();

    await userEvent.click(screen.getByRole("button", { name: /Oficina/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Adicionar outro MyCar/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Criar e abrir" }));

    await waitFor(() => expect(criar).toHaveBeenCalledWith({ perfil: "pessoa", nome: undefined }));
  });

  it("mostra o erro do servidor e não recarrega a tela", async () => {
    vi.spyOn(meusMycarsService, "listar").mockResolvedValue({ mycars: [DOIS.mycars[0]], podeCriar: ["pessoa"] });
    vi.spyOn(meusMycarsService, "criar").mockRejectedValue(
      Object.assign(new Error("422"), {
        isAxiosError: true,
        response: { status: 422, data: { message: "Você já tem um MyCar desse tipo." } },
      }),
    );
    const aoTrocar = montar();

    await userEvent.click(screen.getByRole("button", { name: /Oficina/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Adicionar outro MyCar/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Criar e abrir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Você já tem um MyCar desse tipo.");
    expect(aoTrocar).not.toHaveBeenCalled();
  });

  it("mostra o erro quando a lista não carrega", async () => {
    vi.spyOn(meusMycarsService, "listar").mockRejectedValue(
      Object.assign(new Error("500"), {
        isAxiosError: true,
        response: { status: 500, data: { message: "Servidor fora do ar" } },
      }),
    );
    montar();

    await userEvent.click(screen.getByRole("button", { name: /Oficina/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Servidor fora do ar");
  });
});
