import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Carregando } from "./Carregando";
import { EstadoVazio } from "./EstadoVazio";

describe("Carregando", () => {
  it("é um status com o texto visível, que o leitor de tela anuncia sem interromper", () => {
    render(<Carregando />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Carregando...");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("aceita um texto próprio", () => {
    render(<Carregando texto="Carregando o veículo..." />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando o veículo...");
  });

  it("o ícone é decorativo e só gira com motion-safe (respeita prefers-reduced-motion)", () => {
    render(<Carregando />);

    const icone = screen.getByRole("status").querySelector("svg")!;
    expect(icone).toHaveAttribute("aria-hidden", "true");
    expect(icone).toHaveClass("motion-safe:animate-spin");
    expect(icone).not.toHaveClass("animate-spin");
  });
});

describe("EstadoVazio", () => {
  it("mostra só o título quando não há descrição nem ação", () => {
    render(<EstadoVazio titulo="Nenhuma multa registrada." />);

    const titulo = screen.getByText("Nenhuma multa registrada.");
    const bloco = titulo.parentElement!;
    expect(bloco).toHaveAttribute("data-estado-vazio");
    expect(bloco.children).toHaveLength(1);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    // Não é um aviso dinâmico: não deve ser anunciado como status nem alerta.
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("traz a descrição e a ação no mesmo bloco do título", async () => {
    const aoReservar = vi.fn();
    render(
      <EstadoVazio
        titulo="Nenhum uso agendado neste período."
        descricao="Reserve um veículo para começar."
        acao={<button type="button" onClick={aoReservar}>Reservar veículo</button>}
      />,
    );

    const bloco = screen.getByText("Nenhum uso agendado neste período.").parentElement!;
    expect(bloco).toContainElement(screen.getByText("Reserve um veículo para começar."));
    expect(bloco).toContainElement(screen.getByRole("button", { name: "Reservar veículo" }));

    await userEvent.click(screen.getByRole("button", { name: "Reservar veículo" }));
    expect(aoReservar).toHaveBeenCalledTimes(1);
  });

  it("a caixa tem fundo; a linha (dentro de tabela) não", () => {
    const { rerender } = render(<EstadoVazio titulo="Vazio" />);
    expect(screen.getByText("Vazio").parentElement).toHaveClass("bg-gray-50", "rounded-lg");

    rerender(<EstadoVazio titulo="Vazio" variante="linha" />);
    expect(screen.getByText("Vazio").parentElement).not.toHaveClass("bg-gray-50");
  });
});
