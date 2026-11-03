import { describe, expect, it } from "vitest";
import { mapearOcorrencia } from "./ocorrencias";

describe("mapearOcorrencia", () => {
  it("converte a resposta da API, incluindo as fotos e os valores opcionais", () => {
    const mapeada = mapearOcorrencia({
      id: 7,
      tipo: "avaria",
      tipo_rotulo: "Avaria",
      status: "em_reparo",
      status_rotulo: "Em reparo",
      data_hora: "2026-11-09T08:00:00-03:00",
      local: null,
      descricao: "Retrovisor quebrado",
      veiculo: { id: 1, placa: "AAA1A11" },
      motorista: null,
      fotos: [{ id: 3, momento: "antes", url: "/api/ocorrencias/fotos/3?signature=x" }],
      prejuizo_estimado: 500,
      valor_gasto: 320.5,
      despesa_id: 9,
    });

    expect(mapeada).toMatchObject({
      id: 7,
      tipoRotulo: "Avaria",
      statusRotulo: "Em reparo",
      dataHora: "2026-11-09T08:00:00-03:00",
      motorista: null,
      prejuizoEstimado: 500,
      valorGasto: 320.5,
      despesaId: 9,
    });
    expect(mapeada.fotos).toEqual([{ id: 3, momento: "antes", url: "/api/ocorrencias/fotos/3?signature=x" }]);
  });

  it("deixa os valores vazios quando o motorista não os recebe", () => {
    const mapeada = mapearOcorrencia({
      id: 8,
      tipo: "dano",
      tipo_rotulo: "Dano na carroceria",
      status: "aberta",
      status_rotulo: "Aberta",
      data_hora: "2026-11-09T08:00:00-03:00",
      local: "Pátio",
      descricao: "Arranhão",
      veiculo: null,
      motorista: { id: 2, nome: "João" },
      fotos: [],
    });

    expect(mapeada.prejuizoEstimado).toBeNull();
    expect(mapeada.valorGasto).toBeNull();
    expect(mapeada.despesaId).toBeNull();
  });
});
