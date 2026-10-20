import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import api from "../../services/api";
import { FichaTecnica } from "./FichaTecnica";

function veiculoApi(id: number, ano: number) {
  return { id, apelido: null, placa: "AAA1B25", marca: "Ford", modelo: "Fiesta 1.0", ano };
}

function lista(itens: unknown[]) {
  return {
    data: {
      data: itens,
      meta: { current_page: 1, last_page: 1, per_page: 20, total: itens.length },
      resumo: { total: itens.length, valorTotalFipe: 0 },
    },
  };
}

function ficha(anoDoVeiculo: number, anoDaFicha: number) {
  return {
    data: {
      veiculo: { id: 1, nome: "Ford Fiesta", placa: "AAA1B25", marca: "Ford", modelo: "Fiesta 1.0", ano: anoDoVeiculo, uf: null },
      fipe: null,
      fipe_status: "sem_codigo",
      especificacoes: [],
      dados_catalogo: {
        marca: "ford",
        modelo: "fiesta",
        fonte: "Ficha Completa",
        url: "https://www.fichacompleta.com.br/carros/ford/fiesta-se-1-6-16v-2019",
        versao: `Ford Fiesta SE 1.6 16V ${anoDaFicha}`,
        ano: anoDaFicha,
        coletado_em: "2026-10-15",
        grupos: [{ grupo: "Motor", campos: [{ rotulo: "Potência", valor: "120 cv" }] }],
      },
      manutencao: null,
    },
  };
}

function simular(anoDoVeiculo: number, anoDaFicha: number) {
  vi.spyOn(api, "get").mockImplementation(async (url: string) => {
    if (url === "/conta/veiculos") return lista([veiculoApi(1, anoDoVeiculo)]) as never;
    if (url === "/conta/veiculos/1/ficha-tecnica") return ficha(anoDoVeiculo, anoDaFicha) as never;

    throw new Error(`inesperado: ${url}`);
  });
}

function renderizar() {
  return render(
    <MemoryRouter>
      <FichaTecnica />
    </MemoryRouter>,
  );
}

describe("Ficha técnica: aviso quando o ano da ficha não é o do veículo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Fiesta 2012 com ficha de 2019 avisa com a versão e os dois anos", async () => {
    simular(2012, 2019);
    renderizar();

    const aviso = await screen.findByRole("status");

    expect(aviso).toHaveTextContent("Esta ficha é de Ford Fiesta SE 1.6 16V 2019");
    expect(aviso).toHaveTextContent("o seu veículo é de 2012");
    expect(aviso).toHaveTextContent("potência e consumo");
    // Os dados da ficha continuam aparecendo, só que com o aviso.
    expect(screen.getByText("120 cv")).toBeInTheDocument();
  });

  it("mesmo ano: sem aviso", async () => {
    simular(2019, 2019);
    renderizar();

    expect(await screen.findByText("120 cv")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("um ano de diferença: aviso leve", async () => {
    simular(2018, 2019);
    renderizar();

    expect(await screen.findByRole("status")).toHaveTextContent("um ano de diferença");
  });
});
