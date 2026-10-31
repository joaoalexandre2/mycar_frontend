import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { UsoFormModal } from "./UsoFormModal";

function abrir(modoMotorista: Parameters<typeof UsoFormModal>[0]["modoMotorista"]) {
  return render(
    <NotificacoesProvider>
      <UsoFormModal
        veiculos={[]}
        motoristas={[]}
        centros={[]}
        modoMotorista={modoMotorista}
        onSalvo={vi.fn()}
        onClose={vi.fn()}
      />
    </NotificacoesProvider>,
  );
}

describe("Reserva feita pelo motorista", () => {
  it("mostra o centro amarrado pelo gestor, sem seletores de motorista e centro", () => {
    abrir({ centro: { id: 5, nome: "Entregas" } });

    expect(screen.getByText("Entregas")).toBeInTheDocument();
    expect(screen.getByText(/definido pelo gestor/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Centro de custo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Motorista")).not.toBeInTheDocument();
  });

  it("avisa quando o motorista ainda não está amarrado a um centro", () => {
    abrir({ centro: null });

    expect(screen.getByRole("alert")).toHaveTextContent("Peça ao gestor.");
  });

  it("continua mostrando os seletores para quem não é motorista", () => {
    abrir(null);

    expect(screen.getByLabelText("Motorista")).toBeInTheDocument();
    expect(screen.getByLabelText("Centro de custo")).toBeInTheDocument();
  });
});
