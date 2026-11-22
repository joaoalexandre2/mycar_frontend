import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Alert, type AlertTone } from "./Alert";
import { CLASSES_DO_TOM } from "./tons";

describe("Alert", () => {
  it("erro sai como alert e interrompe o leitor de tela", () => {
    render(<Alert tone="danger">Não foi possível salvar.</Alert>);

    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("Não foi possível salvar.");
    expect(alerta).toHaveAttribute("data-tom", "danger");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("sem tom, é erro", () => {
    render(<Alert>Falhou.</Alert>);

    expect(screen.getByRole("alert")).toHaveTextContent("Falhou.");
  });

  it.each<AlertTone>(["warning", "success", "info"])("%s sai como status, sem interromper", (tone) => {
    render(<Alert tone={tone}>Mensagem {tone}</Alert>);

    const aviso = screen.getByRole("status");
    expect(aviso).toHaveTextContent(`Mensagem ${tone}`);
    expect(aviso).toHaveAttribute("data-tom", tone);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each<AlertTone>(["danger", "warning", "success", "info"])("%s sempre tem caixa e usa os tokens do tema, nunca a escala da marca", (tone) => {
    render(<Alert tone={tone}>Texto</Alert>);

    const caixa = screen.getByText("Texto").closest("[data-tom]") as HTMLElement;
    expect(caixa).toHaveClass("rounded-lg", "border", "px-4", "py-3", ...CLASSES_DO_TOM[tone].split(" "));
    expect(caixa.className).not.toMatch(/\b(bg|text|border)-blue-/);
  });

  it("o ícone é decorativo e pode sair", () => {
    const { container, rerender } = render(<Alert tone="warning">Atenção</Alert>);
    const icone = container.querySelector("svg");
    expect(icone).toHaveAttribute("aria-hidden", "true");

    rerender(<Alert tone="warning" icon={false}>Atenção</Alert>);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("liga a um campo pelo id e aceita classes extras", () => {
    render(
      <>
        <input aria-describedby="erro-placa" aria-label="Placa" />
        <Alert id="erro-placa" className="mt-2">Placa inválida.</Alert>
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Placa" })).toHaveAccessibleDescription("Placa inválida.");
    expect(screen.getByRole("alert")).toHaveClass("mt-2");
  });

  it("a ação fica dentro da mensagem e chama o callback", async () => {
    const tentar = vi.fn();
    render(<Alert action={{ label: "Tentar de novo", onClick: tentar }}>Sem conexão.</Alert>);

    const botao = screen.getByRole("button", { name: "Tentar de novo" });
    expect(screen.getByRole("alert")).toContainElement(botao);
    expect(botao).toHaveAttribute("type", "button");

    await userEvent.click(botao);
    expect(tentar).toHaveBeenCalledTimes(1);
  });

  it("a ação pode ficar desabilitada", async () => {
    const tentar = vi.fn();
    render(<Alert action={{ label: "Tentar de novo", onClick: tentar, disabled: true }}>Sem conexão.</Alert>);

    const botao = screen.getByRole("button", { name: "Tentar de novo" });
    expect(botao).toBeDisabled();
    await userEvent.click(botao);
    expect(tentar).not.toHaveBeenCalled();
  });

  it("recebe o foco quando pedem (ref + tabIndex)", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Alert ref={ref} tone="success" tabIndex={-1}>
        Registrado.
      </Alert>,
    );

    ref.current?.focus();
    expect(screen.getByRole("status")).toHaveFocus();
  });
});
