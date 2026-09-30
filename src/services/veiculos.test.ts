import { describe, expect, it } from "vitest";
import { mapearVeiculo } from "./veiculos";
import { anoDoCodigoFipe } from "./fipe";

const base = {
  id: 1,
  cliente_id: 2,
  placa: "ABC1D23",
  marca: "GM - Chevrolet",
  modelo: "A-10 2.5/4.1",
  ano: 1989,
};

describe("mapearVeiculo - campos FIPE", () => {
  it("converte fipe_valor (string decimal do Laravel) para número", () => {
    const veiculo = mapearVeiculo({
      ...base,
      fipe_marca_id: 23,
      fipe_modelo_id: 926,
      fipe_ano: "1989-1",
      fipe_valor: "11664.00",
      fipe_consultado_em: "2026-09-20T22:59:48.000000Z",
    });

    expect(veiculo.fipeValor).toBe(11664);
    expect(veiculo.fipeMarcaId).toBe(23);
    expect(veiculo.fipeModeloId).toBe(926);
    expect(veiculo.fipeAno).toBe("1989-1");
  });

  it("veículo sem dados FIPE fica com tudo null", () => {
    const veiculo = mapearVeiculo(base);

    expect(veiculo.fipeValor).toBeNull();
    expect(veiculo.fipeMarcaId).toBeNull();
    expect(veiculo.fipeModeloId).toBeNull();
    expect(veiculo.fipeAno).toBeNull();
    expect(veiculo.fipeConsultadoEm).toBeNull();
  });
});

describe("anoDoCodigoFipe", () => {
  it("extrai o ano do código", () => {
    expect(anoDoCodigoFipe("1989-1")).toBe(1989);
  });

  it("ignora zero km (32000) e anos futuros", () => {
    expect(anoDoCodigoFipe("32000-1")).toBeNull();
    expect(anoDoCodigoFipe(`${new Date().getFullYear() + 1}-1`)).toBeNull();
  });
});
