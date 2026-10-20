import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FipeSeletor, type FipeNomes, type FipeSelecao } from "./FipeSeletor";
import { fipeService } from "../../services/fipe";

const MARCAS = [
  { codigo: "59", nome: "VW - VolksWagen" },
  { codigo: "23", nome: "GM - Chevrolet" },
];
const ANOS_VW = [
  { codigo: "32000-1", nome: "32000 Gasolina" },
  { codigo: "2014-5", nome: "2014 Flex" },
  { codigo: "2013-5", nome: "2013 Flex" },
];
const MODELOS_VW_2014 = [
  { codigo: "7001", nome: "Gol 1.0" },
  { codigo: "7002", nome: "Fox 1.6" },
];

function Teste({
  inicial = { marcaId: "", modeloId: "", ano: "" },
  aoMudar,
}: {
  inicial?: FipeSelecao;
  aoMudar?: (s: FipeSelecao, n: FipeNomes) => void;
}) {
  const [valor, setValor] = useState(inicial);

  return (
    <FipeSeletor
      valor={valor}
      onChange={(selecao, nomes) => {
        setValor(selecao);
        aoMudar?.(selecao, nomes);
      }}
    />
  );
}

function simular() {
  return {
    marcas: vi.spyOn(fipeService, "marcas").mockResolvedValue(MARCAS),
    anosDaMarca: vi.spyOn(fipeService, "anosDaMarca").mockResolvedValue(ANOS_VW),
    modelosDoAno: vi.spyOn(fipeService, "modelosDoAno").mockResolvedValue(MODELOS_VW_2014),
  };
}

describe("FipeSeletor (marca, ano e depois modelo)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("o modelo só abre depois do ano, e o ano só depois da marca", async () => {
    simular();
    render(<Teste />);

    const ano = await screen.findByLabelText("Ano FIPE");
    const modelo = screen.getByLabelText("Modelo FIPE");

    expect(ano).toBeDisabled();
    expect(modelo).toBeDisabled();
    expect(screen.getByRole("option", { name: "Escolha o ano antes" })).toBeInTheDocument();
  });

  it("escolher o ano carrega só os modelos daquele ano", async () => {
    const mocks = simular();
    const aoMudar = vi.fn();
    const usuario = userEvent.setup();
    render(<Teste aoMudar={aoMudar} />);

    await usuario.selectOptions(await screen.findByLabelText("Marca FIPE"), "59");
    await waitFor(() => expect(screen.getByLabelText("Ano FIPE")).toBeEnabled());
    expect(mocks.anosDaMarca).toHaveBeenCalledWith("59");

    await usuario.selectOptions(screen.getByLabelText("Ano FIPE"), "2014-5");
    await waitFor(() => expect(screen.getByLabelText("Modelo FIPE")).toBeEnabled());
    expect(mocks.modelosDoAno).toHaveBeenCalledWith("59", "2014-5");
    expect(aoMudar).toHaveBeenLastCalledWith(
      { marcaId: "59", modeloId: "", ano: "2014-5" },
      { ano: 2014 },
    );

    await usuario.selectOptions(screen.getByLabelText("Modelo FIPE"), "7002");
    expect(aoMudar).toHaveBeenLastCalledWith(
      { marcaId: "59", modeloId: "7002", ano: "2014-5" },
      { modelo: "Fox 1.6" },
    );
  });

  it("não oferece zero km nem ano futuro na lista de anos", async () => {
    simular();
    const usuario = userEvent.setup();
    render(<Teste />);

    await usuario.selectOptions(await screen.findByLabelText("Marca FIPE"), "59");
    await waitFor(() => expect(screen.getByLabelText("Ano FIPE")).toBeEnabled());

    expect(screen.queryByRole("option", { name: "32000 Gasolina" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "2014 Flex" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "2013 Flex" })).toBeInTheDocument();
  });

  it("trocar o ano limpa o modelo escolhido e recarrega os modelos", async () => {
    const mocks = simular();
    const aoMudar = vi.fn();
    const usuario = userEvent.setup();
    render(<Teste inicial={{ marcaId: "59", modeloId: "7001", ano: "2014-5" }} aoMudar={aoMudar} />);

    await waitFor(() => expect(screen.getByLabelText("Modelo FIPE")).toBeEnabled());

    await usuario.selectOptions(screen.getByLabelText("Ano FIPE"), "2013-5");

    expect(aoMudar).toHaveBeenLastCalledWith(
      { marcaId: "59", modeloId: "", ano: "2013-5" },
      { ano: 2013 },
    );
    await waitFor(() => expect(mocks.modelosDoAno).toHaveBeenLastCalledWith("59", "2013-5"));
  });

  it("ao editar um veículo já salvo, carrega anos e modelos da seleção", async () => {
    const mocks = simular();
    render(<Teste inicial={{ marcaId: "59", modeloId: "7001", ano: "2014-5" }} />);

    await waitFor(() => expect(screen.getByLabelText("Modelo FIPE")).toBeEnabled());

    expect(mocks.anosDaMarca).toHaveBeenCalledWith("59");
    expect(mocks.modelosDoAno).toHaveBeenCalledWith("59", "2014-5");
    expect(screen.getByLabelText("Ano FIPE")).toHaveValue("2014-5");
    expect(screen.getByLabelText("Modelo FIPE")).toHaveValue("7001");
  });

  it("mostra o erro quando a FIPE não responde", async () => {
    simular();
    vi.spyOn(fipeService, "modelosDoAno").mockRejectedValue(new Error("FIPE fora do ar"));
    const usuario = userEvent.setup();
    render(<Teste inicial={{ marcaId: "59", modeloId: "", ano: "" }} />);

    await waitFor(() => expect(screen.getByLabelText("Ano FIPE")).toBeEnabled());
    await usuario.selectOptions(screen.getByLabelText("Ano FIPE"), "2014-5");

    expect(await screen.findByText(/FIPE fora do ar|Não foi possível|erro/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Modelo FIPE")).toBeDisabled();
  });
});
