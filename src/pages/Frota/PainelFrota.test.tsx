import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { painelFrotaService } from "../../services/frotaDiferenciais";
import { PainelFrota } from "./PainelFrota";
import type { AlertasDaFrota, PainelDeDisponibilidade } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const alertas: AlertasDaFrota = {
  cnh: [{ id: 1, nome: "Maria", validade: "2026-11-10", situacao: "vence_em_breve" }],
  revisoes: [],
  multas_abertas: { quantidade: 2, valor: 260.32 },
  checklists_com_problema: [],
};

const painel: PainelDeDisponibilidade = {
  de: "2026-10-04",
  ate: "2026-11-02",
  horas_periodo: 720,
  utilizacao_media_pct: 12.5,
  veiculos: [
    { veiculo_id: 1, placa: "AAA1A11", nome: "Fiat Strada", horas_usadas: 90, utilizacao_pct: 12.5, ociosidade_pct: 87.5, reservas: 4, km_rodados: 340, multas: 1 },
  ],
};

describe("Painel da frota", () => {
  it("mostra alertas, multas abertas e a utilização de cada veículo", async () => {
    vi.spyOn(painelFrotaService, "alertas").mockResolvedValue(alertas);
    vi.spyOn(painelFrotaService, "disponibilidade").mockResolvedValue(painel);

    render(<PainelFrota />);

    expect(await screen.findByText(/Maria: vence em/)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Utilização de AAA1A11" })).toHaveAttribute("aria-valuenow", "12.5");
    expect(screen.getByText(/ociosa 87.5%/)).toBeInTheDocument();
  });
});
