import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { lazy, Suspense } from "react";
import { ErroDeTela } from "./ErroDeTela";
import { CarregandoTela } from "./CarregandoTela";

describe("ErroDeTela", () => {
  it("mostra o conteúdo quando nada falha", () => {
    render(
      <ErroDeTela>
        <p>Tela normal</p>
      </ErroDeTela>,
    );

    expect(screen.getByText("Tela normal")).toBeInTheDocument();
  });

  it("oferece recarregar quando o pacote da tela não carrega", async () => {
    // O React registra o erro no console; aqui ele é esperado.
    vi.spyOn(console, "error").mockImplementation(() => {});

    const Quebrada = lazy(() =>
      Promise.reject(new Error("Failed to fetch dynamically imported module")),
    );

    render(
      <ErroDeTela>
        <Suspense fallback={<CarregandoTela />}>
          <Quebrada />
        </Suspense>
      </ErroDeTela>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível abrir esta tela.",
    );
    expect(
      screen.getByRole("button", { name: "Recarregar a página" }),
    ).toBeInTheDocument();
  });

  it("mostra o aviso de carregamento enquanto o pacote chega", () => {
    const Lenta = lazy(() => new Promise<never>(() => {}));

    render(
      <ErroDeTela>
        <Suspense fallback={<CarregandoTela />}>
          <Lenta />
        </Suspense>
      </ErroDeTela>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Carregando...");
  });
});
