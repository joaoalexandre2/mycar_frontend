import { describe, expect, it } from "vitest";
import { mapearResumoFinanceiro } from "./financeiro";

describe("mapearResumoFinanceiro", () => {
  it("converte a consolidação do servidor para o formato da tela, incluindo os indicadores", () => {
    const mapeado = mapearResumoFinanceiro({
      total: 480,
      combustivel: { total: 200, litros: 40 },
      servicos: { total: 150, itens: [{ quantidade: 2 }] },
      avulsas: { total: 30, itens: [{ categoria_id: 1, rotulo: "Pedágio", total: 30, quantidade: 1 }] },
      multas: { total: 100, quantidade: 1 },
      seguro: { valor_anual_total: 3000 },
      por_veiculo: [
        { veiculo_id: 1, veiculo: "Fiat Strada", placa: "AAA1A11", combustivel: 200, servicos: 150, avulsas: 30, multas: 100, total: 480, km_rodados: 100, custo_por_km: 4.8 },
      ],
      por_motorista: [],
      por_centro: [],
      mensal: [],
      indicadores: {
        custo_total: 480,
        custo_medio_por_veiculo: 480,
        km_rodados: 100,
        custo_por_km: 4.8,
        veiculo_maior_custo: { veiculo_id: 1, placa: "AAA1A11", valor: 480 },
        veiculo_maior_manutencao: null,
      },
    });

    expect(mapeado.total).toBe(480);
    expect(mapeado.servicos.quantidade).toBe(2);
    expect(mapeado.avulsas.itens[0]).toEqual({ categoriaId: 1, rotulo: "Pedágio", total: 30, quantidade: 1 });
    expect(mapeado.seguro.valorAnualTotal).toBe(3000);
    expect(mapeado.porVeiculo[0]).toMatchObject({ veiculoId: 1, kmRodados: 100, custoPorKm: 4.8 });
    expect(mapeado.indicadores).toMatchObject({
      custoTotal: 480,
      kmRodados: 100,
      veiculoMaiorCusto: { veiculoId: 1, placa: "AAA1A11", valor: 480 },
      veiculoMaiorManutencao: null,
    });
  });
});
