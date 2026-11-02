import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { qrService } from "../../services/frotaDiferenciais";
import { QrVeiculoPagina } from "./QrVeiculoPagina";

afterEach(() => vi.restoreAllMocks());

function pagina(token: string) {
  return render(
    <MemoryRouter initialEntries={[`/qr/${token}`]}>
      <Routes>
        <Route path="/qr/:token" element={<QrVeiculoPagina />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Página do QR do veículo", () => {
  it("mostra o veículo e a reserva de hoje, com o botão do checklist", async () => {
    vi.spyOn(qrService, "resolver").mockResolvedValue({
      veiculo: { id: 1, placa: "AAA1A11", nome: "Fiat Strada", km_atual: 45000 },
      reservas: [
        { id: 9, status: "agendado", momento: "saida", inicio: "2026-11-02T08:00:00Z", fim: "2026-11-02T18:00:00Z", motorista: "Maria", finalidade: "Visita", checklist_feito: false },
      ],
    });

    pagina("abc");

    expect(await screen.findByText("AAA1A11")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fazer checklist de saída" })).toBeInTheDocument();
  });

  it("avisa quando não há reserva sua para o veículo agora", async () => {
    vi.spyOn(qrService, "resolver").mockResolvedValue({
      veiculo: { id: 1, placa: "AAA1A11", nome: "Fiat Strada", km_atual: null },
      reservas: [],
    });

    pagina("abc");

    expect(await screen.findByText(/Nenhuma reserva sua para este veículo agora/)).toBeInTheDocument();
  });

  it("mostra o erro quando o QR não é da frota", async () => {
    vi.spyOn(qrService, "resolver").mockRejectedValue(
      Object.assign(new Error("x"), { isAxiosError: true, response: { status: 404, data: { message: "QR Code não reconhecido para a sua frota." } } }),
    );

    pagina("errado");

    expect(await screen.findByRole("alert")).toHaveTextContent("QR Code não reconhecido para a sua frota.");
  });
});
