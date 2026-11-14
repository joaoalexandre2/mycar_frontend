import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContext } from "../../contexts/authContextDefinition";
import { sugestaoService } from "../../services/sugestoes";
import { Sugestoes } from "./Sugestoes";

vi.mock("../../services/sugestoes", () => ({
  sugestaoService: {
    minhas: vi.fn(),
    todas: vi.fn(),
    enviar: vi.fn(),
    responder: vi.fn(),
  },
}));

function montar() {
  return render(
    <AuthContext.Provider
      value={{
        usuario: { id: 1, name: "Ana", email: "ana@x.com" },
        autenticado: true,
        entrar: vi.fn(),
        sair: vi.fn(),
        atualizarUsuario: vi.fn(),
      }}
    >
      <Sugestoes />
    </AuthContext.Provider>,
  );
}

describe("Sugestões: falha ao carregar a lista", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("oferece 'Tentar de novo' e recarrega a lista", async () => {
    vi.mocked(sugestaoService.minhas)
      .mockRejectedValueOnce(new Error("rede fora"))
      .mockResolvedValueOnce([]);
    montar();

    const alerta = await screen.findByRole("alert");
    await userEvent.click(within(alerta).getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText("Você ainda não enviou nenhuma sugestão.")).toBeInTheDocument();
    expect(sugestaoService.minhas).toHaveBeenCalledTimes(2);
  });
});
