import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  AreaDeTexto,
  Campo,
  CampoDeData,
  CampoDeTexto,
  CampoSelect,
  classeDoCampo,
  classeDoCampoEmLinha,
} from "./Campo";

describe("Campo", () => {
  it("liga o rótulo visível ao controle", () => {
    render(<Campo id="placa" rotulo="Placa">{(a) => <CampoDeTexto {...a} />}</Campo>);

    const campo = screen.getByLabelText("Placa");
    expect(campo).toHaveAttribute("id", "placa");
    expect(campo).not.toHaveAttribute("aria-describedby");
    expect(campo).not.toHaveAttribute("aria-invalid");
    expect(campo).not.toHaveAttribute("aria-required");
  });

  it("descreve o controle com a ajuda", () => {
    render(
      <Campo id="km" rotulo="Km" ajuda="Como aparece no painel.">
        {(a) => <CampoDeTexto {...a} />}
      </Campo>,
    );

    expect(screen.getByLabelText("Km")).toHaveAccessibleDescription("Como aparece no painel.");
  });

  it("com erro, marca aria-invalid e lê o erro antes da ajuda", () => {
    render(
      <Campo id="km" rotulo="Km" ajuda="Como aparece no painel." erro="Informe o km.">
        {(a) => <CampoDeTexto {...a} />}
      </Campo>,
    );

    const campo = screen.getByLabelText("Km");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAttribute("aria-describedby", "km-erro km-ajuda");
    expect(campo).toHaveAccessibleDescription("Informe o km. Como aparece no painel.");
    expect(screen.getByRole("alert")).toHaveTextContent("Informe o km.");
  });

  it("obrigatório: aria-required no controle e asterisco escondido do leitor", () => {
    render(<Campo id="nome" rotulo="Nome" obrigatorio>{(a) => <CampoDeTexto {...a} />}</Campo>);

    // O nome acessível não inclui o asterisco (getByLabelText leria "Nome*").
    const campo = screen.getByRole("textbox", { name: "Nome" });
    expect(campo).toHaveAttribute("aria-required", "true");
    expect(campo).toBeRequired();
    expect(campo).not.toHaveAttribute("required");
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("funciona com select", () => {
    render(
      <Campo id="tipo" rotulo="Tipo">
        {(a) => (
          <CampoSelect {...a}>
            <option value="">Escolha</option>
          </CampoSelect>
        )}
      </Campo>,
    );

    expect(screen.getByRole("combobox", { name: "Tipo" })).toBeInTheDocument();
  });
});

describe("controles", () => {
  it("44px no celular e 40px no desktop, com texto de 14px", () => {
    render(
      <>
        <CampoDeTexto aria-label="Texto" />
        <CampoSelect aria-label="Lista" />
        <CampoDeData aria-label="Data" />
      </>,
    );

    for (const campo of [screen.getByLabelText("Texto"), screen.getByLabelText("Lista"), screen.getByLabelText("Data")]) {
      expect(campo).toHaveClass("h-11", "md:h-10", "text-sm", "w-full");
      expect(campo).not.toHaveClass("text-xs");
    }
  });

  it("largura auto tira o w-full e mantém as alturas", () => {
    render(<CampoDeTexto aria-label="Filtro" largura="auto" className="w-56" />);

    const campo = screen.getByLabelText("Filtro");
    expect(campo).toHaveClass("h-11", "md:h-10", "w-56");
    expect(campo).not.toHaveClass("w-full");
  });

  it("as classes exportadas têm a mesma altura e o mesmo texto", () => {
    for (const classe of [classeDoCampo, classeDoCampoEmLinha]) {
      expect(classe.split(" ")).toEqual(expect.arrayContaining(["h-11", "md:h-10", "text-sm"]));
    }
  });

  it("estados de erro e desabilitado vêm da classe", () => {
    render(<CampoDeTexto aria-label="Campo" disabled aria-invalid />);

    const campo = screen.getByLabelText("Campo");
    expect(campo).toBeDisabled();
    expect(campo).toHaveClass("aria-invalid:border-(--tom-danger-texto)", "disabled:bg-gray-50");
  });

  it("CampoDeData é um input de data e CampoDeTexto é texto por padrão", () => {
    render(
      <>
        <CampoDeData aria-label="Quando" />
        <CampoDeTexto aria-label="Nome" />
        <AreaDeTexto aria-label="Obs" />
      </>,
    );

    expect(screen.getByLabelText("Quando")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Nome")).toHaveAttribute("type", "text");
    expect(screen.getByRole("textbox", { name: "Obs" })).toHaveClass("text-sm", "w-full");
  });
});
