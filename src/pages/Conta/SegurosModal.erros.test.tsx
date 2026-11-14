import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "../../services/api";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import type { VeiculoConta } from "../../types/conta";
import { SegurosModal } from "./SegurosModal";

afterEach(() => vi.restoreAllMocks());

const veiculo = {
  id: 7,
  apelido: null,
  placa: "ABC1D23",
  marca: "Fiat",
  modelo: "Uno",
  ano: 2018,
} as VeiculoConta;

const semSeguro = {
  possui_seguro: false,
  seguros: [],
  referencia: null,
  apolice_atual_id: null,
  melhor_proposta_id: null,
  aviso: "",
};

describe("SegurosModal: falha ao carregar os seguros", () => {
  it("oferece 'Tentar de novo' e carrega os seguros de novo", async () => {
    const get = vi
      .spyOn(api, "get")
      .mockRejectedValueOnce(new Error("rede fora"))
      .mockResolvedValueOnce({ data: semSeguro } as never);

    render(
      <NotificacoesProvider>
        <SegurosModal veiculo={veiculo} onClose={() => {}} />
      </NotificacoesProvider>,
    );

    const alerta = await screen.findByRole("alert");
    await userEvent.click(within(alerta).getByRole("button", { name: "Tentar de novo" }));

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(get).toHaveBeenCalledTimes(2);
  });
});
