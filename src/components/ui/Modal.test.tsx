import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Modal, ModalTelaCheia } from "./Modal";
import { DialogoConfirmacao } from "../feedback/DialogoConfirmacao";

function Tela({
  aoFechar = () => {},
  fecharAoClicarFora,
}: {
  aoFechar?: () => void;
  fecharAoClicarFora?: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div>
      <button onClick={() => setAberto(true)}>Abrir</button>

      {aberto && (
        <Modal
          titulo="Novo seguro"
          subtitulo="Fiat Uno · ABC1D23"
          fecharAoClicarFora={fecharAoClicarFora}
          onClose={() => {
            aoFechar();
            setAberto(false);
          }}
        >
          <form>
            <input aria-label="Seguradora" />
            <input aria-label="Valor" />
            <button type="submit">Salvar</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

describe("Modal", () => {
  it("é um diálogo com o título como nome acessível", async () => {
    render(<Tela />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));

    const dialogo = screen.getByRole("dialog", { name: "Novo seguro" });

    expect(dialogo).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Fiat Uno · ABC1D23")).toBeInTheDocument();
  });

  it("o foco entra no diálogo e volta para o botão que o abriu", async () => {
    render(<Tela />);
    const abrir = screen.getByRole("button", { name: "Abrir" });

    await userEvent.click(abrir);
    expect(screen.getByRole("dialog")).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it("Esc fecha", async () => {
    const aoFechar = vi.fn();
    render(<Tela aoFechar={aoFechar} />);

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    await userEvent.keyboard("{Escape}");

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("o botão Fechar tem nome acessível", async () => {
    const aoFechar = vi.fn();
    render(<Tela aoFechar={aoFechar} />);

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("Tab não sai do diálogo: gira entre o primeiro e o último", async () => {
    render(<Tela />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));

    const fechar = screen.getByRole("button", { name: "Fechar" });
    const salvar = screen.getByRole("button", { name: "Salvar" });

    salvar.focus();
    await userEvent.tab();
    expect(fechar).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(salvar).toHaveFocus();
  });

  it("o botão da página atrás não recebe o foco com Tab", async () => {
    render(<Tela />);
    const abrir = screen.getByRole("button", { name: "Abrir" });
    await userEvent.click(abrir);

    for (let i = 0; i < 6; i++) {
      await userEvent.tab();
      expect(abrir).not.toHaveFocus();
    }
  });

  it("a página atrás não rola enquanto o diálogo está aberto", async () => {
    render(<Tela />);

    expect(document.body.style.overflow).toBe("");

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.keyboard("{Escape}");
    expect(document.body.style.overflow).toBe("");
  });

  it("clicar fora não fecha por padrão (não perde o que foi digitado)", async () => {
    const aoFechar = vi.fn();
    render(<Tela aoFechar={aoFechar} />);

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    const fundo = screen.getByRole("dialog").parentElement as HTMLElement;
    await userEvent.pointer([{ target: fundo, keys: "[MouseLeft]" }]);

    expect(aoFechar).not.toHaveBeenCalled();
  });

  it("clicar fora fecha quando o diálogo pede", async () => {
    const aoFechar = vi.fn();
    render(<Tela aoFechar={aoFechar} fecharAoClicarFora />);

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    const fundo = screen.getByRole("dialog").parentElement as HTMLElement;
    await userEvent.pointer([{ target: fundo, keys: "[MouseLeft]" }]);

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("clicar dentro do diálogo não fecha", async () => {
    const aoFechar = vi.fn();
    render(<Tela aoFechar={aoFechar} fecharAoClicarFora />);

    await userEvent.click(screen.getByRole("button", { name: "Abrir" }));
    await userEvent.click(screen.getByLabelText("Seguradora"));

    expect(aoFechar).not.toHaveBeenCalled();
  });
});

describe("diálogos empilhados", () => {
  function Empilhado({
    aoFecharModal,
    aoResponder,
  }: {
    aoFecharModal: () => void;
    aoResponder: (confirmado: boolean) => void;
  }) {
    return (
      <>
        <Modal titulo="Álbum" onClose={aoFecharModal}>
          <button>Remover foto</button>
        </Modal>
        <DialogoConfirmacao
          opcoes={{ mensagem: "Remover esta foto?", confirmarTexto: "Remover", perigo: true }}
          aoResponder={aoResponder}
        />
      </>
    );
  }

  it("Esc cancela só a confirmação, não o diálogo que está por baixo", async () => {
    const aoFecharModal = vi.fn();
    const aoResponder = vi.fn();

    render(<Empilhado aoFecharModal={aoFecharModal} aoResponder={aoResponder} />);

    await userEvent.keyboard("{Escape}");

    expect(aoResponder).toHaveBeenCalledWith(false);
    expect(aoFecharModal).not.toHaveBeenCalled();
  });

  it("o foco da confirmação não é roubado pelo diálogo de baixo", async () => {
    render(<Empilhado aoFecharModal={() => {}} aoResponder={() => {}} />);

    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();

    const dialogoConfirmacao = screen.getByRole("alertdialog");

    expect(dialogoConfirmacao).toContainElement(document.activeElement as HTMLElement);
  });
});

describe("ModalTelaCheia", () => {
  it("tem rótulo, fecha com Esc e com clique no fundo", async () => {
    const aoFechar = vi.fn();

    render(
      <ModalTelaCheia rotulo="Foto ampliada" onClose={aoFechar}>
        <img alt="Foto do veículo" src="x.jpg" />
      </ModalTelaCheia>,
    );

    expect(screen.getByRole("dialog", { name: "Foto ampliada" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(aoFechar).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("dialog"));
    expect(aoFechar).toHaveBeenCalledTimes(2);
  });
});
