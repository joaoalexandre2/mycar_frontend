import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusChip, type StatusChipTone } from "./StatusChip";
import { CLASSES_DO_TOM } from "./tons";
import { TOM_DO_STATUS_USO } from "../frota/tomDoStatusUso";

describe("StatusChip", () => {
  it("sem tom, é neutro", () => {
    render(<StatusChip>Importado da planilha</StatusChip>);

    expect(screen.getByText("Importado da planilha")).toHaveAttribute("data-tom", "neutral");
  });

  it.each<StatusChipTone>(["neutral", "info", "success", "warning", "danger"])(
    "%s: pílula com o texto visível, sem caixa alta e sem a escala da marca",
    (tone) => {
      render(<StatusChip tone={tone}>Status {tone}</StatusChip>);

      const chip = screen.getByText(`Status ${tone}`);
      expect(chip).toBeVisible();
      expect(chip).toHaveAttribute("data-tom", tone);
      expect(chip).toHaveClass("rounded-full", "text-xs", "font-semibold", ...CLASSES_DO_TOM[tone].split(" "));
      expect(chip.className).not.toMatch(/\buppercase\b/);
      expect(chip.className).not.toMatch(/\b(bg|text|border)-blue-/);
    },
  );

  it("aceita classes extras (ex.: riscado do cancelado)", () => {
    render(<StatusChip className="line-through">Cancelado</StatusChip>);

    expect(screen.getByText("Cancelado")).toHaveClass("line-through", "rounded-full");
  });

  it("status de uso: agendado neutro, em uso info, concluído success", () => {
    expect(TOM_DO_STATUS_USO).toEqual({
      agendado: "neutral",
      em_uso: "info",
      concluido: "success",
      cancelado: "neutral",
    });
  });
});
