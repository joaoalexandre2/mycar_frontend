import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminConteudoService } from "../../services/admin";
import { ConteudoUsuario } from "./ConteudoUsuario";

vi.mock("../../services/admin", () => ({
  adminConteudoService: { conteudo: vi.fn(), acessos: vi.fn() },
}));

const conteudo = {
  usuario: { id: 7, nome: "Marcos Oficina", email: "marcos@x.com", perfil: "oficina" as const },
  limitePorSecao: 500,
  secoes: [
    {
      chave: "clientes",
      titulo: "Clientes",
      total: 1,
      linhas: [{ id: 1, nome: "Maria Souza", cpf: "123.456.789-09", ativo: true, telefone: null }],
    },
    { chave: "veiculos", titulo: "Veículos", total: 0, linhas: [] },
  ],
};

describe("ConteudoUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra o conteúdo da primeira seção, com o aviso de que a consulta é registrada", async () => {
    vi.mocked(adminConteudoService.conteudo).mockResolvedValue(conteudo);

    render(<ConteudoUsuario usuarioId={7} aoFechar={vi.fn()} />);

    expect(await screen.findByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getByText("123.456.789-09")).toBeInTheDocument();
    expect(screen.getByText("Sim")).toBeInTheDocument();
    expect(screen.getByText(/consulta foi registrada/i)).toBeInTheDocument();
    expect(adminConteudoService.conteudo).toHaveBeenCalledWith(7);
  });

  it("troca de seção e avisa quando está vazia", async () => {
    vi.mocked(adminConteudoService.conteudo).mockResolvedValue(conteudo);
    const user = userEvent.setup();

    render(<ConteudoUsuario usuarioId={7} aoFechar={vi.fn()} />);
    await screen.findByText("Maria Souza");

    await user.click(screen.getByRole("tab", { name: /Veículos/ }));

    expect(screen.getByText("Nada cadastrado nesta seção.")).toBeInTheDocument();
  });

  it("mostra o erro quando o servidor recusa", async () => {
    vi.mocked(adminConteudoService.conteudo).mockRejectedValue(new Error("falhou"));

    render(<ConteudoUsuario usuarioId={7} aoFechar={vi.fn()} />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
