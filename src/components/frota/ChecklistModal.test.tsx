import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { checklistService } from "../../services/frotaDiferenciais";
import { ChecklistModal } from "./ChecklistModal";
import type { RespostaDeChecklists } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const resposta: RespostaDeChecklists = {
  itens: { combustivel: "Nível de combustível", pneus: "Pneus e estepe" },
  checklists: [],
};

describe("ChecklistModal", () => {
  it("não envia enquanto houver item sem resposta", async () => {
    vi.spyOn(checklistService, "listar").mockResolvedValue(resposta);
    const enviar = vi.spyOn(checklistService, "enviar");
    const usuario = userEvent.setup();

    render(<ChecklistModal usoId={7} momento="saida" onSalvo={() => {}} onClose={() => {}} />);

    const salvar = await screen.findByRole("button", { name: "Salvar checklist" });
    await usuario.click(salvar);

    const erro = screen.getByRole("alert");
    expect(erro).toHaveTextContent("Marque cada item como OK ou com problema.");
    expect(enviar).not.toHaveBeenCalled();

    // Erro e botão ficam juntos no rodapé fixo, fora da lista que rola.
    const rodape = salvar.closest("[data-rodape-do-modal]");
    expect(rodape).not.toBeNull();
    expect(rodape).toContainElement(erro);
    expect(screen.getByRole("button", { name: "Cancelar" }).closest("[data-rodape-do-modal]")).toBe(rodape);
    expect(screen.getByText("Nível de combustível").closest("form")).toBe((salvar as HTMLButtonElement).form);
  });

  it("enquanto carrega, não mostra rodapé de salvar", () => {
    vi.spyOn(checklistService, "listar").mockReturnValue(new Promise(() => {}));

    render(<ChecklistModal usoId={7} momento="saida" onSalvo={() => {}} onClose={() => {}} />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.getByRole("dialog").querySelector("[data-rodape-do-modal]")).toBeNull();
  });

  it("envia cada item com OK ou problema", async () => {
    vi.spyOn(checklistService, "listar").mockResolvedValue(resposta);
    const enviar = vi.spyOn(checklistService, "enviar").mockResolvedValue({
      id: 1, momento: "saida", itens: [], problemas: 1, observacoes: null, quando: "2026-11-02T10:00:00Z",
    });
    const usuario = userEvent.setup();

    render(<ChecklistModal usoId={7} momento="saida" onSalvo={() => {}} onClose={() => {}} />);

    await screen.findByText("Nível de combustível");
    const combustivel = screen.getAllByRole("radio", { name: "OK" })[0];
    await usuario.click(combustivel);
    const pneus = screen.getAllByRole("radio", { name: "Problema" })[1];
    await usuario.click(pneus);
    await usuario.click(screen.getByRole("button", { name: "Salvar checklist" }));

    await waitFor(() =>
      expect(enviar).toHaveBeenCalledWith(7, {
        momento: "saida",
        itens: [
          { item: "combustivel", ok: true },
          { item: "pneus", ok: false },
        ],
        observacoes: null,
      }),
    );
  });

  it("avisa quando o checklist desse momento já foi feito", async () => {
    vi.spyOn(checklistService, "listar").mockResolvedValue({
      ...resposta,
      checklists: [{ id: 1, momento: "saida", itens: [], problemas: 0, observacoes: null, quando: "2026-11-02T10:00:00Z" }],
    });

    render(<ChecklistModal usoId={7} momento="saida" onSalvo={() => {}} onClose={() => {}} />);

    expect(await screen.findByText("Este checklist de saída já foi feito.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar checklist" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog").querySelector("[data-rodape-do-modal]")).toBeNull();
  });
});
