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
const MODELOS_VW = [
  { codigo: "7001", nome: "Gol 1.0 Mi Total Flex 8V 4p" },
  { codigo: "7002", nome: "Gol 1.6 Mi Total Flex 8V 4p" },
  { codigo: "7003", nome: "Fox 1.6 Mi Total Flex 8V 5p" },
  { codigo: "7004", nome: "Santa Fe GLS 3.5 V6 Aut." },
];
const ANOS_GOL_1_0 = [
  { codigo: "32000-1", nome: "32000 Gasolina" },
  { codigo: "2014-5", nome: "2014 Flex" },
  { codigo: "2013-5", nome: "2013 Flex" },
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
    modelos: vi.spyOn(fipeService, "modelos").mockResolvedValue(MODELOS_VW),
    anos: vi.spyOn(fipeService, "anos").mockResolvedValue(ANOS_GOL_1_0),
  };
}

/** Abre a lista do campo e escolhe a opção pelo nome. */
async function escolher(campo: string, opcao: string | RegExp) {
  const usuario = userEvent.setup();
  await usuario.click(screen.getByRole("combobox", { name: campo }));
  await usuario.click(await screen.findByRole("option", { name: opcao }));
}

const campo = (nome: string) => screen.getByRole("combobox", { name: nome });

describe("FipeSeletor (marca, modelo, versão e ano, todos com busca)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("cada campo só abre depois do anterior", async () => {
    simular();
    render(<Teste />);

    await waitFor(() => expect(campo("Marca FIPE")).toBeEnabled());

    expect(campo("Modelo FIPE")).toBeDisabled();
    expect(campo("Versão FIPE")).toBeDisabled();
    expect(campo("Ano FIPE")).toBeDisabled();
    expect(campo("Modelo FIPE")).toHaveAttribute("placeholder", "Escolha a marca antes");
  });

  it("a marca se encontra digitando, sem acento ou maiúscula", async () => {
    simular();
    const usuario = userEvent.setup();
    render(<Teste />);

    await waitFor(() => expect(campo("Marca FIPE")).toBeEnabled());
    await usuario.type(campo("Marca FIPE"), "chevro");

    expect(screen.getByRole("option", { name: "GM - Chevrolet" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "VW - VolksWagen" })).not.toBeInTheDocument();
  });

  it("a lista de modelos separa o modelo da versão", async () => {
    const mocks = simular();
    render(<Teste />);

    await waitFor(() => expect(campo("Marca FIPE")).toBeEnabled());
    await escolher("Marca FIPE", "VW - VolksWagen");
    await waitFor(() => expect(campo("Modelo FIPE")).toBeEnabled());

    expect(mocks.modelos).toHaveBeenCalledWith("59");

    const usuario = userEvent.setup();
    await usuario.click(campo("Modelo FIPE"));

    expect(screen.getByRole("option", { name: "Gol" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Fox" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Santa Fe" })).toBeInTheDocument();
    // Gol aparece uma vez só, mesmo com duas versões na FIPE.
    expect(screen.getAllByRole("option", { name: "Gol" })).toHaveLength(1);
  });

  it("escolhe marca, modelo, versão e ano e avisa o que foi escolhido", async () => {
    const mocks = simular();
    const aoMudar = vi.fn();
    render(<Teste aoMudar={aoMudar} />);

    await waitFor(() => expect(campo("Marca FIPE")).toBeEnabled());
    await escolher("Marca FIPE", "VW - VolksWagen");
    await waitFor(() => expect(campo("Modelo FIPE")).toBeEnabled());
    await escolher("Modelo FIPE", "Gol");

    // Só as versões do Gol, com o texto da versão.
    expect(campo("Versão FIPE")).toBeEnabled();
    const usuario = userEvent.setup();
    await usuario.click(campo("Versão FIPE"));
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(screen.getByRole("option", { name: "1.0 Mi Total Flex 8V 4p" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Fox|1.6 Mi Total Flex 8V 5p/ })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("option", { name: "1.0 Mi Total Flex 8V 4p" }));
    await waitFor(() => expect(campo("Ano FIPE")).toBeEnabled());
    expect(mocks.anos).toHaveBeenCalledWith("59", "7001");
    expect(aoMudar).toHaveBeenLastCalledWith(
      { marcaId: "59", modeloId: "7001", ano: "" },
      { modelo: "Gol 1.0 Mi Total Flex 8V 4p" },
    );

    await escolher("Ano FIPE", "2014 Flex");
    expect(aoMudar).toHaveBeenLastCalledWith(
      { marcaId: "59", modeloId: "7001", ano: "2014-5" },
      { ano: 2014 },
    );
  });

  it("não oferece zero km nem ano futuro na lista de anos", async () => {
    simular();
    const usuario = userEvent.setup();
    render(<Teste inicial={{ marcaId: "59", modeloId: "7001", ano: "" }} />);

    await waitFor(() => expect(campo("Ano FIPE")).toBeEnabled());
    await usuario.click(campo("Ano FIPE"));

    expect(screen.queryByRole("option", { name: "32000 Gasolina" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "2014 Flex" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "2013 Flex" })).toBeInTheDocument();
  });

  it("trocar o modelo limpa a versão e o ano", async () => {
    simular();
    const aoMudar = vi.fn();
    render(<Teste inicial={{ marcaId: "59", modeloId: "7001", ano: "2014-5" }} aoMudar={aoMudar} />);

    await waitFor(() => expect(campo("Ano FIPE")).toBeEnabled());
    await escolher("Modelo FIPE", "Fox");

    expect(aoMudar).toHaveBeenLastCalledWith({ marcaId: "59", modeloId: "", ano: "" }, {});
    expect(campo("Versão FIPE")).toHaveValue("");
    expect(campo("Ano FIPE")).toBeDisabled();
  });

  it("trocar a marca limpa tudo e carrega os modelos da nova marca", async () => {
    const mocks = simular();
    const aoMudar = vi.fn();
    render(<Teste inicial={{ marcaId: "59", modeloId: "7001", ano: "2014-5" }} aoMudar={aoMudar} />);

    await waitFor(() => expect(campo("Ano FIPE")).toBeEnabled());
    await escolher("Marca FIPE", "GM - Chevrolet");

    expect(aoMudar).toHaveBeenLastCalledWith(
      { marcaId: "23", modeloId: "", ano: "" },
      { marca: "GM - Chevrolet" },
    );
    await waitFor(() => expect(mocks.modelos).toHaveBeenLastCalledWith("23"));
  });

  it("ao editar um veículo já salvo, mostra marca, modelo, versão e ano da seleção", async () => {
    const mocks = simular();
    render(<Teste inicial={{ marcaId: "59", modeloId: "7001", ano: "2014-5" }} />);

    await waitFor(() => expect(campo("Ano FIPE")).toBeEnabled());

    expect(mocks.modelos).toHaveBeenCalledWith("59");
    expect(mocks.anos).toHaveBeenCalledWith("59", "7001");
    expect(campo("Marca FIPE")).toHaveValue("VW - VolksWagen");
    expect(campo("Modelo FIPE")).toHaveValue("Gol");
    expect(campo("Versão FIPE")).toHaveValue("1.0 Mi Total Flex 8V 4p");
    expect(campo("Ano FIPE")).toHaveValue("2014 Flex");
  });

  it("mostra o erro quando a FIPE não responde", async () => {
    simular();
    vi.spyOn(fipeService, "anos").mockRejectedValue(new Error("FIPE fora do ar"));
    render(<Teste inicial={{ marcaId: "59", modeloId: "", ano: "" }} />);

    await waitFor(() => expect(campo("Modelo FIPE")).toBeEnabled());
    await escolher("Modelo FIPE", "Gol");
    await escolher("Versão FIPE", "1.0 Mi Total Flex 8V 4p");

    expect(await screen.findByText(/FIPE fora do ar|Não foi possível|erro/i)).toBeInTheDocument();
    expect(campo("Ano FIPE")).toBeDisabled();
  });
});
