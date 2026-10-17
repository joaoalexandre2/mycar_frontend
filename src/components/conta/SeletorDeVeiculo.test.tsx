import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import api from "../../services/api";
import { SeletorDeVeiculo } from "./SeletorDeVeiculo";
import { Comparador } from "../../pages/Conta/Comparador";
import { FichaTecnica } from "../../pages/Conta/FichaTecnica";
import type { VeiculoConta } from "../../types/conta";

type Parametros = Record<string, unknown>;

const veiculos = [
  { id: 1, apelido: "Carro da família", placa: "ABC1D23", marca: "Fiat", modelo: "Uno", ano: 2018 },
  { id: 150, apelido: null, placa: "ZZZ9Z99", marca: "VW", modelo: "Zeta", ano: 2020 },
];

function pagina(dados: unknown[]) {
  return {
    data: {
      data: dados,
      meta: { current_page: 1, last_page: 1, per_page: dados.length, total: 150 },
      resumo: { total: 150, valorTotalFipe: 0 },
    },
  } as never;
}

/** Simula a API: só devolve o que casa com `busca` (placa, apelido, marca ou modelo). */
function simularListagem() {
  return vi
    .spyOn(api, "get")
    .mockImplementation(async (url: string, config?: { params?: Parametros }) => {
      if (url !== "/conta/veiculos") {
        // fichas técnicas e afins: vazias
        return { data: { manutencao: null, especificacoes: [], fipe: null, fipe_status: "sem_codigo", dados_catalogo: null, veiculo: { nome: "x", placa: "x", marca: "x", modelo: "x", ano: 2018 } } } as never;
      }

      const busca = String(config?.params?.busca ?? "").toLowerCase();
      const limite = Number(config?.params?.per_page ?? 15);
      const achados = veiculos.filter((v) =>
        [v.placa, v.apelido ?? "", v.marca, v.modelo].some((t) => t.toLowerCase().includes(busca)),
      );

      return pagina(achados.slice(0, limite));
    });
}

function Campo({
  aoMudar,
  opcaoVazia,
}: {
  aoMudar: (id: string, veiculo: VeiculoConta | null) => void;
  opcaoVazia?: string;
}) {
  const [valor, setValor] = useState("");

  return (
    <SeletorDeVeiculo
      valor={valor}
      opcaoVazia={opcaoVazia}
      aoMudar={(id, veiculo) => {
        setValor(id);
        aoMudar(id, veiculo);
      }}
    />
  );
}

describe("SeletorDeVeiculo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("acha um veículo da frota pela busca, sem baixar a lista toda", async () => {
    const get = simularListagem();
    const aoMudar = vi.fn();

    render(<Campo aoMudar={aoMudar} />);

    await userEvent.type(screen.getByRole("combobox", { name: "Veículo" }), "zeta");

    // Pede ao servidor só os 20 primeiros que casam com o texto (depois da
    // pequena espera da digitação).
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith("/conta/veiculos", {
        params: { page: 1, per_page: 20, busca: "zeta" },
      }),
    );

    await userEvent.click(await screen.findByRole("option", { name: "VW Zeta · ZZZ9Z99" }));

    expect(aoMudar).toHaveBeenCalledWith(
      "150",
      expect.objectContaining({ id: 150, placa: "ZZZ9Z99" }),
    );
  });

  it("mostra o apelido do veículo no rótulo", async () => {
    simularListagem();

    render(<Campo aoMudar={() => {}} />);

    await userEvent.click(screen.getByRole("combobox"));

    expect(
      await screen.findByRole("option", { name: "Carro da família · ABC1D23" }),
    ).toBeInTheDocument();
  });

  it("oferece a opção de nenhum veículo e devolve valor vazio", async () => {
    simularListagem();
    const aoMudar = vi.fn();

    render(<Campo aoMudar={aoMudar} opcaoVazia="Todos os veículos" />);

    expect(screen.getByRole("combobox")).toHaveValue("Todos os veículos");

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Carro da família · ABC1D23" }));
    expect(screen.getByRole("combobox")).toHaveValue("Carro da família · ABC1D23");

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Todos os veículos" }));

    expect(aoMudar).toHaveBeenLastCalledWith("", null);
    expect(screen.getByRole("combobox")).toHaveValue("Todos os veículos");
  });
});

describe("telas da conta não baixam mais 100 veículos", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["Comparador", <Comparador key="c" />],
    ["Ficha técnica", <FichaTecnica key="f" />],
  ])("%s pede só o primeiro veículo ao abrir", async (_nome, tela) => {
    const get = simularListagem();

    render(<MemoryRouter>{tela}</MemoryRouter>);

    // O veículo padrão aparece escolhido (o primeiro da conta).
    expect(
      await screen.findByDisplayValue("Carro da família · ABC1D23"),
    ).toBeInTheDocument();

    const pedidos = get.mock.calls
      .filter(([url]) => url === "/conta/veiculos")
      .map(([, config]) => (config as { params: Parametros }).params);

    expect(pedidos.length).toBeGreaterThan(0);
    for (const params of pedidos) {
      expect(Number(params.per_page)).toBeLessThanOrEqual(20);
    }
  });
});
