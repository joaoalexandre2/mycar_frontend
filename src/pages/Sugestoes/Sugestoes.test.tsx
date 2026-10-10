import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../contexts/authContextDefinition";
import { sugestaoService } from "../../services/sugestoes";
import type { Sugestao } from "../../types/sugestoes";
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

describe("Sugestoes: tipo da sugestão", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sugestaoService.minhas).mockResolvedValue([]);
  });

  it("usa botões em vez de menu nativo, com uma opção marcada", async () => {
    montar();
    await waitFor(() => expect(sugestaoService.minhas).toHaveBeenCalled());

    expect(screen.getByRole("radiogroup", { name: "Tipo" })).toBeInTheDocument();

    const opcoes = screen.getAllByRole("radio");
    expect(opcoes).toHaveLength(4);
    expect(opcoes.filter((o) => o.getAttribute("aria-checked") === "true")).toHaveLength(1);
  });

  it("envia a categoria do botão escolhido", async () => {
    vi.mocked(sugestaoService.enviar).mockResolvedValue({
      id: 9,
      categoria: "problema",
      titulo: "Botão não abre",
      descricao: "Ao clicar nada acontece na tela.",
      status: "nova",
      resposta: null,
      criadaEm: "2026-10-10T12:00:00Z",
      anexos: [],
    } satisfies Sugestao);
    const user = userEvent.setup();
    montar();
    await waitFor(() => expect(sugestaoService.minhas).toHaveBeenCalled());

    await user.click(screen.getByRole("radio", { name: "Problema ou erro" }));
    expect(screen.getByRole("radio", { name: "Problema ou erro" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Botão não abre" } });
    fireEvent.change(screen.getByLabelText("Conte a ideia"), {
      target: { value: "Ao clicar nada acontece na tela." },
    });
    await user.click(screen.getByRole("button", { name: /enviar sugestão/i }));

    await waitFor(() => expect(sugestaoService.enviar).toHaveBeenCalled());
    expect(vi.mocked(sugestaoService.enviar).mock.calls[0][0]).toMatchObject({
      categoria: "problema",
      titulo: "Botão não abre",
    });
  });
});
