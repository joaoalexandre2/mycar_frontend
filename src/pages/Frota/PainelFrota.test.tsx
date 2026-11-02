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
  checklists_com_problema_total: 0,
};

const painel: PainelDeDisponibilidade = {
  de: "2026-10-04",
  ate: "2026-11-02",
  horas_periodo: 720,
  utilizacao_real_media_pct: 5,
  reserva_media_pct: 12.5,
  veiculos: [
    {
      veiculo_id: 1,
      placa: "AAA1A11",
      nome: "Fiat Strada",
      horas_em_uso: 36,
      utilizacao_real_pct: 5,
      horas_reservadas: 90,
      reserva_pct: 12.5,
      disponibilidade_pct: 87.5,
      reservas: 4,
      km_rodados: 340,
      multas: 1,
    },
  ],
};

describe("Painel da frota", () => {
  it("separa o uso real, a reserva e a disponibilidade de cada veículo", async () => {
    vi.spyOn(painelFrotaService, "alertas").mockResolvedValue(alertas);
    vi.spyOn(painelFrotaService, "disponibilidade").mockResolvedValue(painel);

    render(<PainelFrota />);

    expect(await screen.findByText(/Maria: vence em/)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Uso real de AAA1A11" })).toHaveAttribute("aria-valuenow", "5");
    expect(screen.getByText(/disponível 87.5%/)).toBeInTheDocument();
    expect(screen.getByText(/reservado 12.5% \(90 h\)/)).toBeInTheDocument();
  });
});
