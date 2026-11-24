import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Abas } from "./Abas";

type Chave = "um" | "dois" | "tres";

const itens = [
  { chave: "um", titulo: "Primeira" },
  { chave: "dois", titulo: "Segunda" },
  { chave: "tres", titulo: "Terceira" },
] as const;

function Exemplo() {
  const [atual, setAtual] = useState<Chave>("um");

  return (
    <Abas itens={itens} atual={atual} onMudar={setAtual} rotulo="Exemplo">
      <p>Conteúdo de {atual}</p>
    </Abas>
  );
}

describe("Abas", () => {
  it("liga cada aba ao seu painel e só o da escolhida aparece", () => {
    render(<Exemplo />);

    expect(screen.getByRole("tablist", { name: "Exemplo" })).toBeInTheDocument();
    const abas = screen.getAllByRole("tab");
    expect(abas).toHaveLength(3);

    for (const aba of abas) {
      const painel = document.getElementById(aba.getAttribute("aria-controls") ?? "");
      expect(painel).toHaveAttribute("role", "tabpanel");
      expect(painel).toHaveAttribute("aria-labelledby", aba.id);
    }

    const visivel = screen.getByRole("tabpanel");
    expect(visivel).toHaveAccessibleName("Primeira");
    expect(visivel).toHaveTextContent("Conteúdo de um");
    expect(screen.getAllByRole("tabpanel", { hidden: true })).toHaveLength(3);
  });

  it("só a aba escolhida entra no Tab (roving tabindex)", () => {
    render(<Exemplo />);

    const [primeira, segunda, terceira] = screen.getAllByRole("tab");
    expect(primeira).toHaveAttribute("tabindex", "0");
    expect(primeira).toHaveAttribute("aria-selected", "true");
    expect(segunda).toHaveAttribute("tabindex", "-1");
    expect(terceira).toHaveAttribute("tabindex", "-1");
  });

  it("setas, Home e End mudam de aba e levam o foco", async () => {
    const usuario = userEvent.setup();
    render(<Exemplo />);

    await usuario.tab();
    expect(screen.getByRole("tab", { name: "Primeira" })).toHaveFocus();

    await usuario.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Segunda" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Segunda" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Conteúdo de dois");

    await usuario.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Terceira" })).toHaveFocus();

    // Dá a volta nas pontas.
    await usuario.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Primeira" })).toHaveFocus();

    await usuario.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Terceira" })).toHaveFocus();

    await usuario.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Primeira" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Conteúdo de um");
  });

  it("clique escolhe a aba", async () => {
    const usuario = userEvent.setup();
    render(<Exemplo />);

    await usuario.click(screen.getByRole("tab", { name: "Terceira" }));

    expect(screen.getByRole("tab", { name: "Terceira" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Conteúdo de tres");
  });

  it("sem abas, não desenha nada", () => {
    const { container } = render(
      <Abas itens={[]} atual={undefined} onMudar={() => {}} rotulo="Vazio">
        <p>nada</p>
      </Abas>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  // O jsdom não avalia media query: confere a classe que vira
  // @media (pointer: coarse) { min-height: 44px } no CSS do Tailwind.
  it("em tela de toque cada aba tem ao menos 44px de altura, sem tirar o contorno de foco", () => {
    render(<Exemplo />);

    for (const aba of screen.getAllByRole("tab")) {
      expect(aba).toHaveClass("pointer-coarse:min-h-11");
      expect(aba.className).not.toMatch(/outline-none/);
    }
  });
});
