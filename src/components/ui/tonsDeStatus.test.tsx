import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErroDeLista } from "./ErroDeLista";
import { ErroDoCampo } from "./ErroDoCampo";
import { CLASSES_DO_TOM } from "./tons";
import { idDoErro } from "../../hooks/useErrosDeCampo";
import { StatusManutencaoBadge } from "../../pages/Manutencoes/StatusManutencaoBadge";
import { StatusOrdemServicoBadge } from "../../pages/OrdensServico/StatusOrdemServicoBadge";
import { TOM_DO_STATUS_OS } from "../../pages/OrdensServico/statusOrdemServico";
import type { StatusOrdemServico } from "../../types/ordemServico";

describe("status de manutenção", () => {
  it.each([
    ["em_dia", "Em dia", "success"],
    ["proxima", "Próxima", "warning"],
    ["atrasada", "Atrasada", "danger"],
  ] as const)("%s vira StatusChip %s", (status, texto, tom) => {
    render(<StatusManutencaoBadge status={status} />);

    const chip = screen.getByText(texto);
    expect(chip).toHaveAttribute("data-tom", tom);
    expect(chip).toHaveClass("rounded-full", ...CLASSES_DO_TOM[tom].split(" "));
  });
});

describe("status de ordem de serviço", () => {
  it("cada status tem um tom diferente, e nenhum usa a escala da marca", () => {
    const tons = Object.values(TOM_DO_STATUS_OS);
    expect(new Set(tons).size).toBe(tons.length);

    (Object.keys(TOM_DO_STATUS_OS) as StatusOrdemServico[]).forEach((status) => {
      const { unmount } = render(<StatusOrdemServicoBadge status={status} />);
      const chip = document.querySelector("[data-tom]") as HTMLElement;
      expect(chip).toHaveAttribute("data-tom", TOM_DO_STATUS_OS[status]);
      expect(chip.className).not.toMatch(/\b(bg|text|border)-blue-/);
      unmount();
    });
  });

  it("mantém os rótulos", () => {
    render(<StatusOrdemServicoBadge status="aguardando_peca" />);

    expect(screen.getByText("Aguardando peça")).toHaveAttribute("data-tom", "warning");
  });
});

describe("ErroDeLista", () => {
  it("continua como alert, com título, mensagem e Tentar de novo, nos tokens do tom danger", async () => {
    const tentar = vi.fn();
    render(<ErroDeLista mensagem="Servidor fora do ar." aoTentarDeNovo={tentar} />);

    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("Não foi possível carregar a lista.");
    expect(alerta).toHaveTextContent("Servidor fora do ar.");
    expect(alerta).toHaveAttribute("data-tom", "danger");
    expect(alerta).toHaveClass(...CLASSES_DO_TOM.danger.split(" "));
    expect(alerta.className).not.toMatch(/\b(bg|border)-red-/);

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(tentar).toHaveBeenCalledTimes(1);
  });

  it("aceita outro título", () => {
    render(<ErroDeLista titulo="Não foi possível carregar a sua preferência." mensagem="x" aoTentarDeNovo={() => {}} />);

    expect(screen.getByText("Não foi possível carregar a sua preferência.")).toBeInTheDocument();
  });
});

describe("ErroDoCampo", () => {
  it("fica leve: só o texto no tom danger, sem caixa", () => {
    render(<ErroDoCampo campo="placa" mensagem="Placa inválida." />);

    const erro = screen.getByRole("alert");
    expect(erro).toHaveAttribute("id", idDoErro("placa"));
    expect(erro).toHaveTextContent("Placa inválida.");
    expect(erro).toHaveClass("text-(--tom-danger-texto)");
    expect(erro.className).not.toMatch(/\b(rounded|border|bg-)/);
  });

  it("sem mensagem, não mostra nada", () => {
    const { container } = render(<ErroDoCampo campo="placa" />);

    expect(container).toBeEmptyDOMElement();
  });
});
