import { afterEach, describe, expect, it, vi } from "vitest";
import api from "./api";
import { clientesService } from "./clientes";
import { veiculosService } from "./veiculos";
import { rotuloVeiculo } from "../utils/rotulos";

function respostaPaginada(dados: unknown[]) {
  return {
    data: {
      data: dados,
      meta: { current_page: 1, last_page: 1, per_page: 20, total: dados.length },
      resumo: {},
    },
  } as never;
}

describe("busca para selects", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clientes: pede só os primeiros 20 ao servidor, com o termo digitado", async () => {
    const get = vi
      .spyOn(api, "get")
      .mockResolvedValueOnce(
        respostaPaginada([
          { id: 1, nome: "Ana", cpf: "11122233344", telefone: "11999990000", ativo: true },
        ]),
      );

    const clientes = await clientesService.buscar("ana");

    expect(get).toHaveBeenCalledWith("/clientes", {
      params: { page: 1, busca: "ana", per_page: 20 },
    });
    expect(clientes).toHaveLength(1);
    expect(clientes[0].nome).toBe("Ana");
  });

  it("clientes: termo vazio não manda o parâmetro busca", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValueOnce(respostaPaginada([]));

    await clientesService.buscar("");

    expect(get).toHaveBeenCalledWith("/clientes", {
      params: { page: 1, busca: undefined, per_page: 20 },
    });
  });

  it("veículos: busca pelo servidor e devolve o veículo com o cliente", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValueOnce(
      respostaPaginada([
        {
          id: 7,
          cliente_id: 1,
          placa: "ABC1D23",
          marca: "Fiat",
          modelo: "Uno",
          ano: 2018,
          cliente: { id: 1, nome: "Ana" },
        },
      ]),
    );

    const veiculos = await veiculosService.buscar("abc");

    expect(get).toHaveBeenCalledWith("/veiculos", {
      params: { page: 1, busca: "abc", per_page: 20 },
    });
    expect(rotuloVeiculo(veiculos[0])).toBe("Fiat Uno - ABC1D23 - Ana");
  });

  it("rotuloVeiculo funciona sem cliente", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValueOnce(
      respostaPaginada([
        { id: 8, cliente_id: 2, placa: "XYZ9K88", marca: "VW", modelo: "Gol", ano: 2020 },
      ]),
    );

    const [veiculo] = await veiculosService.buscar("");

    expect(get).toHaveBeenCalled();
    expect(rotuloVeiculo(veiculo)).toBe("VW Gol - XYZ9K88");
  });
});
