import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { checklistService } from "../../services/frotaDiferenciais";
import { ChecklistModal } from "./ChecklistModal";
import type { ModeloDeChecklist, RespostaDeChecklists } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const modelo: ModeloDeChecklist = {
  id: 9,
  nome: "Carro de entrega",
  momento: "ambos",
  itens: [
    { chave: "pneus", rotulo: "Pneus", obrigatorio: true },
    { chave: "estepe", rotulo: "Estepe", obrigatorio: false },
  ],
};

const resposta: RespostaDeChecklists = { itens: {} as RespostaDeChecklists["itens"], modelos: [modelo], checklists: [] };

describe("ChecklistModal com o modelo da empresa", () => {
  it("pede a descrição quando um item tem problema", async () => {
    vi.spyOn(checklistService, "listar").mockResolvedValue(resposta);
    const enviar = vi.spyOn(checklistService, "enviar");
    const usuario = userEvent.setup();

    render(<ChecklistModal usoId={7} momento="saida" onSalvo={() => {}} onClose={() => {}} />);

    await screen.findByText("Pneus");
    await usuario.click(screen.getAllByRole("radio", { name: "Problema" })[0]);
    await usuario.click(screen.getByRole("button", { name: "Salvar checklist" }));

    const erro = screen.getByRole("alert");
    expect(erro).toHaveTextContent('Descreva o problema em "Pneus".');
    expect(erro.closest("[data-rodape-do-modal]")).toContainElement(screen.getByRole("button", { name: "Salvar checklist" }));
    expect(enviar).not.toHaveBeenCalled();

    // O foco vai para o campo de descrição desse item, marcado como inválido.
    const descricao = screen.getByRole("textbox", { name: "Descreva o problema em Pneus" });
    expect(descricao).toHaveFocus();
    expect(descricao).toHaveAttribute("aria-invalid", "true");
    expect(descricao).toHaveAccessibleDescription('Descreva o problema em "Pneus".');
  });

  it("envia a situação de cada item (OK, problema ou não se aplica) e o modelo usado", async () => {
    vi.spyOn(checklistService, "listar").mockResolvedValue(resposta);
    const enviar = vi.spyOn(checklistService, "enviar").mockResolvedValue({
      id: 1, momento: "saida", itens: [], problemas: 0, observacoes: null, quando: "2026-11-10T10:00:00Z",
    });
    const usuario = userEvent.setup();

    render(<ChecklistModal usoId={7} momento="saida" onSalvo={() => {}} onClose={() => {}} />);

    await screen.findByText("Pneus");
    await usuario.click(screen.getAllByRole("radio", { name: "OK" })[0]);
    await usuario.click(screen.getAllByRole("radio", { name: "Não se aplica" })[1]);
    await usuario.click(screen.getByRole("button", { name: "Salvar checklist" }));

    await waitFor(() =>
      expect(enviar).toHaveBeenCalledWith(7, {
        momento: "saida",
        checklist_modelo_id: 9,
        itens: [
          { item: "pneus", situacao: "ok", observacao: null },
          { item: "estepe", situacao: "na", observacao: null },
        ],
        observacoes: null,
      }),
    );
  });
});
