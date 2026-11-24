import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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

  it("diz qual item falta, rola até ele e põe o foco no grupo de opções", async () => {
    vi.spyOn(checklistService, "listar").mockResolvedValue(resposta);
    const rolar = vi.fn();
    Element.prototype.scrollIntoView = rolar;
    const usuario = userEvent.setup();

    try {
      render(<ChecklistModal usoId={7} momento="saida" onSalvo={() => {}} onClose={() => {}} />);

      await screen.findByText("Nível de combustível");
      await usuario.click(screen.getAllByRole("radio", { name: "OK" })[0]);
      await usuario.click(screen.getByRole("button", { name: "Salvar checklist" }));

      expect(screen.getByRole("alert")).toHaveTextContent('Falta "Pneus e estepe".');

      const grupo = screen.getByRole("radiogroup", { name: /Pneus e estepe/ });
      expect(grupo).toHaveFocus();
      expect(grupo).toHaveAttribute("aria-invalid", "true");
      expect(grupo).toHaveAccessibleDescription(/Falta "Pneus e estepe"/);
      expect(rolar).toHaveBeenCalledTimes(1);
      expect(rolar.mock.contexts[0]).toBe(grupo);
      // O item já respondido não fica marcado.
      expect(screen.getByRole("radiogroup", { name: /Nível de combustível/ })).not.toHaveAttribute("aria-invalid");

      // Respondido, deixa de ser inválido.
      await usuario.click(screen.getAllByRole("radio", { name: "OK" })[1]);
      expect(grupo).not.toHaveAttribute("aria-invalid");
    } finally {
      delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
    }
  });

  it("com vários faltando, aponta o primeiro e conta os outros", async () => {
    vi.spyOn(checklistService, "listar").mockResolvedValue(resposta);
    const usuario = userEvent.setup();

    render(<ChecklistModal usoId={7} momento="saida" onSalvo={() => {}} onClose={() => {}} />);

    await usuario.click(await screen.findByRole("button", { name: "Salvar checklist" }));

    expect(screen.getByRole("alert")).toHaveTextContent('Falta "Nível de combustível" e mais 1 item.');
    expect(screen.getByRole("radiogroup", { name: /Nível de combustível/ })).toHaveFocus();
  });

  it("mostra quantos itens já foram respondidos, num status discreto", async () => {
    vi.spyOn(checklistService, "listar").mockResolvedValue(resposta);
    const usuario = userEvent.setup();

    render(<ChecklistModal usoId={7} momento="saida" onSalvo={() => {}} onClose={() => {}} />);

    // O "Carregando..." também é um status agora: espera o do progresso pelo texto.
    const progresso = await screen.findByText("0 de 2 itens respondidos");
    expect(progresso).toHaveAttribute("role", "status");
    expect(screen.getAllByRole("status")).toHaveLength(1);

    await usuario.click(screen.getAllByRole("radio", { name: "Problema" })[1]);
    expect(progresso).toHaveTextContent("1 de 2 itens respondidos");

    await usuario.click(screen.getAllByRole("radio", { name: "OK" })[0]);
    expect(progresso).toHaveTextContent("2 de 2 itens respondidos");
  });

  it("falha ao carregar: 'Tentar de novo' pede o checklist outra vez", async () => {
    const listar = vi
      .spyOn(checklistService, "listar")
      .mockRejectedValueOnce(
        Object.assign(new Error("500"), { isAxiosError: true, response: { status: 500, data: { message: "Servidor fora do ar" } } }),
      )
      .mockResolvedValueOnce(resposta);
    const usuario = userEvent.setup();

    render(<ChecklistModal usoId={7} momento="saida" onSalvo={() => {}} onClose={() => {}} />);

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Servidor fora do ar");

    await usuario.click(within(alerta).getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText("Nível de combustível")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(listar).toHaveBeenCalledTimes(2);
  });
});
