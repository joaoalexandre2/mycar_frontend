import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "./NotificacoesProvider";
import { useConfirmar, useToast } from "../hooks/useNotificacoes";

function Painel({ aoDecidir }: { aoDecidir: (confirmado: boolean) => void }) {
  const toast = useToast();
  const pedirConfirmacao = useConfirmar();

  return (
    <div>
      <button onClick={() => toast.erro("Falhou ao salvar")}>erro</button>
      <button onClick={() => toast.sucesso("Salvo")}>sucesso</button>
      <button onClick={() => toast.aviso("Preencha o nome")}>aviso</button>
      <button
        onClick={async () =>
          aoDecidir(
            await pedirConfirmacao({
              mensagem: "Excluir o cliente?",
              confirmarTexto: "Excluir",
              perigo: true,
            }),
          )
        }
      >
        excluir
      </button>
    </div>
  );
}

function renderizar(aoDecidir: (confirmado: boolean) => void = () => {}) {
  return render(
    <NotificacoesProvider>
      <Painel aoDecidir={aoDecidir} />
    </NotificacoesProvider>,
  );
}

describe("NotificacoesProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra o erro como alerta e permite fechar", async () => {
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "erro" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Falhou ao salvar");

    await userEvent.click(screen.getByRole("button", { name: "Fechar aviso" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("sucesso e aviso aparecem como status", async () => {
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "sucesso" }));
    await userEvent.click(screen.getByRole("button", { name: "aviso" }));

    const avisos = screen.getAllByRole("status");

    expect(avisos).toHaveLength(2);
    expect(avisos[0]).toHaveTextContent("Salvo");
    expect(avisos[1]).toHaveTextContent("Preencha o nome");
  });

  it("o aviso some sozinho depois de um tempo", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "sucesso" }));
    expect(screen.getByRole("status")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(4100);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("confirmar resolve true quando a pessoa confirma", async () => {
    const aoDecidir = vi.fn();
    renderizar(aoDecidir);

    await userEvent.click(screen.getByRole("button", { name: "excluir" }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Excluir o cliente?",
    );

    await userEvent.click(screen.getByRole("button", { name: "Excluir" }));

    expect(aoDecidir).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("confirmar resolve false ao cancelar, e o foco começa no Cancelar", async () => {
    const aoDecidir = vi.fn();
    renderizar(aoDecidir);

    await userEvent.click(screen.getByRole("button", { name: "excluir" }));

    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(aoDecidir).toHaveBeenCalledWith(false);
  });

  it("Esc cancela a confirmação", async () => {
    const aoDecidir = vi.fn();
    renderizar(aoDecidir);

    await userEvent.click(screen.getByRole("button", { name: "excluir" }));
    await userEvent.keyboard("{Escape}");

    expect(aoDecidir).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("falha com mensagem clara fora do provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(<Painel aoDecidir={() => {}} />),
    ).toThrow(/NotificacoesProvider/);
  });
});
