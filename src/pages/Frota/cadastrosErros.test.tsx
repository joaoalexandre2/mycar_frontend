import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { motoristasService } from "../../services/frota";
import { Cadastros } from "./Cadastros";
import type { Motorista } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const ana: Motorista = { id: 1, nome: "Ana Lima", telefone: null, cnhNumero: null, cnhValidade: null, ativo: true };

function cadastros() {
  return render(
    <NotificacoesProvider>
      <Cadastros />
    </NotificacoesProvider>,
  );
}

describe("Cadastros: erros de carga e de ação ficam separados", () => {
  it("uma ação que falha mostra o erro e mantém a lista na tela", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([ana]);
    vi.spyOn(motoristasService, "atualizar").mockRejectedValue(new Error("falhou"));
    cadastros();

    expect(await screen.findByText("Ana Lima")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Desativar" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Ana Lima")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
  });

  it("uma falha ao carregar oferece 'Tentar de novo' e recarrega a lista", async () => {
    const listar = vi
      .spyOn(motoristasService, "listar")
      .mockRejectedValueOnce(new Error("rede fora"))
      .mockResolvedValueOnce([ana]);
    cadastros();

    const alerta = await screen.findByRole("alert");
    await userEvent.click(within(alerta).getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText("Ana Lima")).toBeInTheDocument();
    expect(listar).toHaveBeenCalledTimes(2);
  });
});
