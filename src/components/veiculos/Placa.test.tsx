import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Placa } from "./Placa";

// Classes que o tema escuro inverte em index.css (":root.dark .bg-white" e a
// escala de cinzas): a placa não pode usá-las.
const INVERTIDAS = /\b(bg-white|text-gray-\d+|border-gray-\d+)\b/;

function classesDe(el: Element) {
  return [el, ...el.querySelectorAll("*")].map((e) => e.getAttribute("class") ?? "").join(" ");
}

describe("Placa", () => {
  it.each([
    ["Mercosul", "FJB4E12", /Placa Mercosul FJB4E12/],
    ["antiga", "CMG3164", /Placa CMG-3164/],
  ])("placa %s usa cores fixas e texto de no mínimo 8px", (_, placa, nome) => {
    render(<Placa placa={placa} uf="SP" />);

    const classes = classesDe(screen.getByRole("img", { name: nome }));
    expect(classes).not.toMatch(INVERTIDAS);
    expect(classes).not.toMatch(/text-\[[0-7]px\]/);
  });

  it("texto fora do padrão também fica claro no tema escuro", () => {
    render(<Placa placa="XYZ" />);

    expect(screen.getByText("XYZ").className).not.toMatch(INVERTIDAS);
  });
});
