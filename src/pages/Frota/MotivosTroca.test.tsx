import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { motivosTrocaCentroService } from "../../services/frota";
import { MotivosTroca } from "./MotivosTroca";

afterEach(() => vi.restoreAllMocks());

function comProvedores(ui: React.ReactNode) {
  return render(<NotificacoesProvider>{ui}</NotificacoesProvider>);
}

describe("Motivos de troca de centro", () => {
  it("lista os motivos, inclusive os desativados", async () => {
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([
      { id: 1, nome: "Erro de lançamento", ativo: true },
      { id: 2, nome: "Antigo", ativo: false },
    ]);

    comProvedores(<MotivosTroca />);

    expect(await screen.findByText("Erro de lançamento")).toBeInTheDocument();
    expect(screen.getByText("Antigo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reativar" })).toBeInTheDocument();
  });

  it("cadastra um motivo novo", async () => {
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([]);
    const criar = vi.spyOn(motivosTrocaCentroService, "criar").mockResolvedValue({ id: 3, nome: "Reclassificação", ativo: true });
    const usuario = userEvent.setup();

    comProvedores(<MotivosTroca />);

    await usuario.type(await screen.findByLabelText("Novo motivo"), "Reclassificação");
    await usuario.click(screen.getByRole("button", { name: "Cadastrar motivo" }));

    await waitFor(() => expect(criar).toHaveBeenCalledWith("Reclassificação"));
  });

  it("desativa um motivo", async () => {
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([{ id: 1, nome: "Erro", ativo: true }]);
    const atualizar = vi.spyOn(motivosTrocaCentroService, "atualizar").mockResolvedValue({ id: 1, nome: "Erro", ativo: false });
    const usuario = userEvent.setup();

    comProvedores(<MotivosTroca />);

    await usuario.click(await screen.findByRole("button", { name: "Desativar" }));

    await waitFor(() => expect(atualizar).toHaveBeenCalledWith(1, { ativo: false }));
  });
});
