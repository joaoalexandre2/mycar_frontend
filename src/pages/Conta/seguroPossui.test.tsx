import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "../../services/api";
import { mapearSeguros } from "../../services/conta/seguros";
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

const apolice = {
  id: 11,
  tipo: "apolice",
  seguradora: "Porto",
  valor_anual: "2400.00",
  franquia: null,
  vigencia_fim: "2027-03-15",
  observacoes: null,
  valor_mensal: 200,
  vs_referencia_pct: null,
  economia_vs_apolice: null,
};

function resposta(possui: boolean | null | undefined, seguros: object[] = []) {
  return {
    ...(possui === undefined ? {} : { possui_seguro: possui }),
    seguros,
    referencia: null,
    apolice_atual_id: seguros.some((s) => (s as { tipo: string }).tipo === "apolice") ? 11 : null,
    melhor_proposta_id: null,
    aviso: "",
  };
}

function abrir(dados: ReturnType<typeof resposta>) {
  vi.spyOn(api, "get").mockResolvedValue({ data: dados } as never);

  render(
    <NotificacoesProvider>
      <SegurosModal veiculo={veiculo} onClose={() => {}} />
    </NotificacoesProvider>,
  );
}

describe("SegurosModal: este veículo já tem seguro?", () => {
  it("sem resposta, pergunta com Sim e Não", async () => {
    abrir(resposta(null));

    expect(await screen.findByText("Este veículo já tem seguro?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sim, já tem" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Não tem" })).toBeInTheDocument();
  });

  it("responder Sim guarda a resposta e já deixa o cadastro do seguro atual com o vencimento", async () => {
    abrir(resposta(null));
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: resposta(true) } as never);

    await userEvent.click(await screen.findByRole("button", { name: "Sim, já tem" }));

    await waitFor(() => expect(put).toHaveBeenCalledWith("/conta/veiculos/7/possui-seguro", { possui: true }));
    expect(await screen.findByText(/Informe abaixo a seguradora e o vencimento/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Meu seguro atual" })).toBeChecked();
    expect(screen.getByLabelText(/Vencimento do seguro/)).toBeInTheDocument();
  });

  it("responder Não esconde a opção de seguro atual: só propostas", async () => {
    abrir(resposta(null));
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: resposta(false) } as never);

    await userEvent.click(await screen.findByRole("button", { name: "Não tem" }));

    await waitFor(() => expect(put).toHaveBeenCalledWith("/conta/veiculos/7/possui-seguro", { possui: false }));
    expect(await screen.findByText(/Sem seguro neste veículo/)).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Meu seguro atual" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Vencimento do seguro/)).not.toBeInTheDocument();
  });

  it("quem respondeu Não pode mudar de ideia", async () => {
    abrir(resposta(false));
    const put = vi.spyOn(api, "put").mockResolvedValue({ data: resposta(true) } as never);

    await userEvent.click(await screen.findByRole("button", { name: "Na verdade já tem" }));

    await waitFor(() => expect(put).toHaveBeenCalledWith("/conta/veiculos/7/possui-seguro", { possui: true }));
    expect(await screen.findByRole("radio", { name: "Meu seguro atual" })).toBeInTheDocument();
  });

  it("com o seguro atual cadastrado, mostra a seguradora e o vencimento e não oferece desistir", async () => {
    abrir(resposta(true, [apolice]));

    // A seguradora aparece no aviso do topo e na lista de seguros.
    expect(await screen.findByText(/vence em/)).toHaveTextContent("O seguro de Porto vence em 15/03/2027");
    expect(screen.getAllByText("Porto")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Na verdade não tem" })).not.toBeInTheDocument();
  });

  it("respondeu Sim mas ainda sem apólice: pode voltar atrás", async () => {
    abrir(resposta(true));

    expect(await screen.findByRole("button", { name: "Na verdade não tem" })).toBeInTheDocument();
  });

  it("cadastrar o seguro atual envia o vencimento", async () => {
    abrir(resposta(true));
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: resposta(true, [apolice]) } as never);

    await userEvent.type(await screen.findByLabelText("Seguradora"), "Porto");
    await userEvent.type(screen.getByLabelText(/Valor por ano/), "2.400,00");
    await userEvent.type(screen.getByLabelText(/Vencimento do seguro/), "2027-03-15");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][0]).toBe("/conta/veiculos/7/seguros");
    expect(post.mock.calls[0][1]).toMatchObject({
      tipo: "apolice",
      seguradora: "Porto",
      valor_anual: 2400,
      vigencia_fim: "2027-03-15",
    });
    expect(await screen.findByText(/vence em/)).toHaveTextContent("15/03/2027");
  });

  it("mostra o aviso do servidor quando não dá para marcar que não tem seguro", async () => {
    abrir(resposta(true));
    vi.spyOn(api, "put").mockRejectedValue(
      Object.assign(new Error("422"), {
        isAxiosError: true,
        response: { status: 422, data: { message: "Este veículo tem um seguro cadastrado. Remova-o antes de marcar que não tem seguro." } },
      }),
    );

    await userEvent.click(await screen.findByRole("button", { name: "Na verdade não tem" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Remova-o antes de marcar que não tem seguro");
  });

  it("resposta antiga do servidor, sem o campo, funciona como não respondido", async () => {
    abrir(resposta(undefined));

    expect(await screen.findByRole("button", { name: "Sim, já tem" })).toBeInTheDocument();
  });
});

describe("mapearSeguros: possui_seguro", () => {
  const base = { seguros: [], referencia: null, apolice_atual_id: null, melhor_proposta_id: null, aviso: "" };

  it("mantém verdadeiro, falso e não respondido", () => {
    expect(mapearSeguros({ ...base, possui_seguro: true }).possuiSeguro).toBe(true);
    expect(mapearSeguros({ ...base, possui_seguro: false }).possuiSeguro).toBe(false);
    expect(mapearSeguros({ ...base, possui_seguro: null }).possuiSeguro).toBeNull();
    expect(mapearSeguros(base).possuiSeguro).toBeNull();
  });
});
