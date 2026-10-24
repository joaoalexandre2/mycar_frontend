import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "../../services/api";
import { mapearAbastecimentos } from "../../services/conta/abastecimentos";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import type { VeiculoConta } from "../../types/conta";
import { AbastecimentosModal } from "./AbastecimentosModal";

afterEach(() => vi.restoreAllMocks());

const veiculo = {
  id: 7,
  apelido: null,
  placa: "ABC1D23",
  marca: "Fiat",
  modelo: "Uno",
  ano: 2018,
} as VeiculoConta;

const resumoVazio = {
  consumo_medio_km_l: null,
  custo_por_km: null,
  total_gasto: 0,
  total_litros: 0,
  preco_medio_litro: null,
  km_atual: null,
  quantidade: 0,
};

const resposta = (tanque: number | null | undefined) => ({
  ...(tanque === undefined ? {} : { tanque_litros: tanque }),
  abastecimentos: [],
  resumo: resumoVazio,
});

async function abrir(tanque: number | null | undefined) {
  vi.spyOn(api, "get").mockResolvedValue({ data: resposta(tanque) } as never);
  const post = vi.spyOn(api, "post").mockResolvedValue({ data: resposta(tanque) } as never);

  render(
    <NotificacoesProvider>
      <AbastecimentosModal veiculo={veiculo} onClose={() => {}} />
    </NotificacoesProvider>,
  );

  return post;
}

const campoLitros = () => screen.getByLabelText(/^litros/i);
const caixaCheio = () => screen.getByRole("checkbox", { name: /encheu o tanque/i });

describe("AbastecimentosModal: tanque cheio usa a capacidade da ficha", () => {
  it("com o tanque cheio marcado, preenche os litros com a capacidade e trava o campo", async () => {
    await abrir(48);

    await waitFor(() => expect(campoLitros()).toBeDisabled());
    expect(campoLitros()).toHaveValue("48");
    expect(screen.getByText(/capacidade do tanque na ficha técnica do modelo \(48 l\)/i)).toBeInTheDocument();
  });

  it("mostra a capacidade com vírgula quando não é número inteiro", async () => {
    await abrir(38.5);

    await waitFor(() => expect(campoLitros()).toHaveValue("38,5"));
  });

  it("desmarcar o tanque cheio libera o campo para digitar os litros", async () => {
    await abrir(48);
    await waitFor(() => expect(campoLitros()).toBeDisabled());

    await userEvent.click(caixaCheio());

    expect(campoLitros()).toBeEnabled();
    expect(campoLitros()).toHaveValue("");
    await userEvent.type(campoLitros(), "20,5");
    expect(campoLitros()).toHaveValue("20,5");

    // Marcar de novo trava outra vez, sem perder o que foi digitado para quando desmarcar.
    await userEvent.click(caixaCheio());
    expect(campoLitros()).toBeDisabled();
    expect(campoLitros()).toHaveValue("48");

    await userEvent.click(caixaCheio());
    expect(campoLitros()).toHaveValue("20,5");
  });

  it("registra com a capacidade do tanque como litros", async () => {
    const post = await abrir(48);
    await waitFor(() => expect(campoLitros()).toBeDisabled());

    await userEvent.type(screen.getByLabelText(/km no hodômetro/i), "45200");
    await userEvent.type(screen.getByLabelText(/valor pago/i), "290,00");
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1]).toMatchObject({ km: 45200, litros: 48, valor_total: 290, tanque_cheio: true });
  });

  it("abastecimento parcial envia os litros digitados e tanque_cheio falso", async () => {
    const post = await abrir(48);
    await waitFor(() => expect(campoLitros()).toBeDisabled());

    await userEvent.click(caixaCheio());
    await userEvent.type(screen.getByLabelText(/km no hodômetro/i), "45200");
    await userEvent.type(campoLitros(), "20,5");
    await userEvent.type(screen.getByLabelText(/valor pago/i), "120,00");
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1]).toMatchObject({ litros: 20.5, tanque_cheio: false });
  });

  it("sem a capacidade na ficha, o campo continua livre e avisa", async () => {
    await abrir(null);

    expect(await screen.findByText(/não traz a capacidade do tanque/i)).toBeInTheDocument();
    expect(campoLitros()).toBeEnabled();

    await userEvent.type(campoLitros(), "41,2");
    expect(campoLitros()).toHaveValue("41,2");
  });

  it("resposta antiga, sem o campo, funciona como sem capacidade (sem travar)", async () => {
    await abrir(undefined);

    expect(await screen.findByText(/não traz a capacidade do tanque/i)).toBeInTheDocument();
    expect(campoLitros()).toBeEnabled();
  });
});

describe("mapearAbastecimentos: tanque_litros", () => {
  const base = { abastecimentos: [], resumo: resumoVazio };

  it("lê a capacidade como número, inclusive quando vem como texto", () => {
    expect(mapearAbastecimentos({ ...base, tanque_litros: 48 }).tanqueLitros).toBe(48);
    expect(mapearAbastecimentos({ ...base, tanque_litros: "38.5" }).tanqueLitros).toBe(38.5);
  });

  it("ausente, nulo ou zero vira nulo", () => {
    expect(mapearAbastecimentos(base).tanqueLitros).toBeNull();
    expect(mapearAbastecimentos({ ...base, tanque_litros: null }).tanqueLitros).toBeNull();
    expect(mapearAbastecimentos({ ...base, tanque_litros: 0 }).tanqueLitros).toBeNull();
  });
});
