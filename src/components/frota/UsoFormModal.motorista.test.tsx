import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { usosService } from "../../services/frota";
import { UsoFormModal } from "./UsoFormModal";

afterEach(() => vi.restoreAllMocks());

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

describe("Rodapé fixo da reserva", () => {
  it("Reservar e Cancelar ficam no rodapé, com alvo de toque de 44px no celular", () => {
    abrir(null);

    const reservar = screen.getByRole("button", { name: "Reservar" });
    const rodape = reservar.closest("[data-rodape-do-modal]");

    expect(rodape).not.toBeNull();
    expect(screen.getByRole("button", { name: "Cancelar" }).closest("[data-rodape-do-modal]")).toBe(rodape);
    expect(reservar).toHaveClass("h-11", "md:h-10");
    // Fora do <form>, mas é o botão de envio dele (o Enter num campo continua enviando).
    expect(reservar).toHaveAttribute("type", "submit");
    expect((reservar as HTMLButtonElement).form).toBe(screen.getByLabelText("Veículo").closest("form"));
  });

  it("o erro de envio aparece no rodapé, logo acima do botão", async () => {
    const criar = vi.spyOn(usosService, "criar");
    abrir(null);

    await userEvent.click(screen.getByRole("button", { name: "Reservar" }));

    const erro = await screen.findByRole("alert");
    expect(erro).toHaveTextContent("Escolha o veículo.");
    expect(erro.closest("[data-rodape-do-modal]")).toContainElement(screen.getByRole("button", { name: "Reservar" }));
    expect(criar).not.toHaveBeenCalled();
  });

  it("o aviso de centro de custo do motorista continua no corpo, junto do campo", () => {
    abrir({ centro: null });

    expect(screen.getByRole("alert").closest("[data-rodape-do-modal]")).toBeNull();
  });
});
