import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { catalogoEsteticaService, patioService } from "../../services/estetica";
import { Patio } from "./Patio";
import { ServicosEPacotes } from "./ServicosEPacotes";
import type { AtendimentoDaEstetica } from "../../types/estetica";

afterEach(() => vi.restoreAllMocks());

const carro: AtendimentoDaEstetica = {
  id: 1,
  placa: "ABC1D23",
  modelo: "Fiat Strada",
  cliente_nome: "Maria",
  cliente_telefone: null,
  etapa: "entrada",
  etapa_seguinte: "atendimento",
  valor: 80,
  total_servicos: 80,
  forma_pagamento: null,
  pago: false,
  dias_em_aberto: null,
  entrada_em: "2026-11-02T10:00:00Z",
  previsao_entrega: null,
  entregue_em: null,
  observacoes: null,
  servicos: [{ nome: "Lavagem completa", preco: 80 }],
  fotos_checkin: 0,
  fotos_checkout: 0,
};

function comProvedor(elemento: React.ReactElement) {
  return render(<NotificacoesProvider>{elemento}</NotificacoesProvider>);
}

describe("Pátio: erro de ação e erro de carga separados", () => {
  it("uma ação que falha mantém os carros na tela", async () => {
    vi.spyOn(patioService, "listar").mockResolvedValue([carro]);
    vi.spyOn(patioService, "avancar").mockRejectedValue(new Error("falhou"));
    comProvedor(<Patio />);

    const entrada = await screen.findByRole("region", { name: "Entrada" });
    await userEvent.click(within(entrada).getByRole("button", { name: "Iniciar atendimento" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("ABC1D23")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
  });

  it("uma falha ao carregar oferece 'Tentar de novo' e recarrega o pátio", async () => {
    const listar = vi
      .spyOn(patioService, "listar")
      .mockRejectedValueOnce(new Error("rede fora"))
      .mockResolvedValueOnce([carro]);
    comProvedor(<Patio />);

    const alerta = await screen.findByRole("alert");
    await userEvent.click(within(alerta).getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText("ABC1D23")).toBeInTheDocument();
    expect(listar).toHaveBeenCalledTimes(2);
  });
});

describe("Serviços e pacotes da estética: falha ao carregar", () => {
  it("a falha ao carregar os pacotes oferece 'Tentar de novo'", async () => {
    vi.spyOn(catalogoEsteticaService, "servicos").mockResolvedValue([]);
    const pacotes = vi
      .spyOn(catalogoEsteticaService, "pacotes")
      .mockRejectedValueOnce(new Error("rede fora"))
      .mockResolvedValueOnce([]);
    comProvedor(<ServicosEPacotes />);

    const alerta = await screen.findByRole("alert");
    await userEvent.click(within(alerta).getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText("Nenhum pacote cadastrado.")).toBeInTheDocument();
    expect(pacotes).toHaveBeenCalledTimes(2);
  });
});
