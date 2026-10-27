import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Quadro } from "./Quadro";
import { InfoCard } from "../ui/InfoCard";
import { StatusOrdemServicoBadge } from "../../pages/OrdensServico/StatusOrdemServicoBadge";

// A escala "blue" do app é a cor da marca (vermelha): usada como "alerta" ela
// ficava igual ao "perigo" e a "Aberta" igual à "Cancelada".
describe("cores de situação distinguíveis", () => {
  it("Quadro: alerta e perigo não usam a mesma cor", () => {
    render(
      <>
        <Quadro titulo="A" valor="1" tom="alerta" />
        <Quadro titulo="B" valor="2" tom="perigo" />
      </>,
    );

    const alerta = screen.getByText("1").className;
    const perigo = screen.getByText("2").className;

    expect(alerta).toContain("text-amber-700");
    expect(perigo).toContain("text-red-600");
    expect(alerta).not.toContain("blue");
  });

  it("OS: Aberta e Cancelada não usam cores parecidas", () => {
    render(
      <>
        <StatusOrdemServicoBadge status="aberta" />
        <StatusOrdemServicoBadge status="cancelada" />
      </>,
    );

    expect(screen.getByText("Aberta").className).not.toContain("blue");
    expect(screen.getByText("Aberta").className).not.toContain("red");
    expect(screen.getByText("Cancelada").className).toContain("red");
  });

  it("InfoCard: o valor encolhe para caber no cartão", () => {
    render(<InfoCard label="Valor" value="R$ 1.250.000,00" icon={<span />} />);

    expect(screen.getByText("R$ 1.250.000,00").className).toContain("valor-fluido");
  });
});
