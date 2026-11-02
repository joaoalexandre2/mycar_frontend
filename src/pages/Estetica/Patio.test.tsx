import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { patioService } from "../../services/estetica";
import { Patio } from "./Patio";
import type { AtendimentoDaEstetica } from "../../types/estetica";

afterEach(() => vi.restoreAllMocks());

function carro(parcial: Partial<AtendimentoDaEstetica> = {}): AtendimentoDaEstetica {
  return {
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
    ...parcial,
  };
}

function tela() {
  return render(
    <NotificacoesProvider>
      <Patio />
    </NotificacoesProvider>,
  );
}

describe("Pátio da estética", () => {
  it("mostra o carro na coluna da etapa dele", async () => {
    vi.spyOn(patioService, "listar").mockResolvedValue([carro()]);

    tela();

    const entrada = await screen.findByRole("region", { name: "Entrada" });
    expect(entrada).toHaveTextContent("ABC1D23");
    expect(screen.getByRole("region", { name: "Entregues" })).toHaveTextContent("Nenhum carro aqui.");
  });

  it("leva o carro para a próxima etapa", async () => {
    const listar = vi.spyOn(patioService, "listar").mockResolvedValue([carro()]);
    const avancar = vi.spyOn(patioService, "avancar").mockResolvedValue(carro({ etapa: "atendimento" }));
    const usuario = userEvent.setup();

    tela();

    await usuario.click(await screen.findByRole("button", { name: /Iniciar atendimento/ }));

    await waitFor(() => expect(avancar).toHaveBeenCalledWith(1));
    expect(listar).toHaveBeenCalledTimes(2);
  });
});
