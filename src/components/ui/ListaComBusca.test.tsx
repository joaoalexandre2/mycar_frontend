import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListaComBusca, type OpcaoDaLista } from "./ListaComBusca";

const OPCOES: OpcaoDaLista[] = [
  { codigo: "a", nome: "São Paulo" },
  { codigo: "b", nome: "Rio de Janeiro" },
  { codigo: "c", nome: "Santa Catarina" },
];

function Campo({ opcoes = OPCOES, aoMudar = () => {} }: { opcoes?: OpcaoDaLista[]; aoMudar?: (c: string) => void }) {
  const [valor, setValor] = useState("");

  return (
    <ListaComBusca
      rotulo="Estado"
      placeholder="Busque o estado"
      valor={valor}
      opcoes={opcoes}
      onChange={(codigo) => {
        setValor(codigo);
        aoMudar(codigo);
      }}
    />
  );
}

const campo = () => screen.getByRole("combobox", { name: "Estado" });

describe("ListaComBusca", () => {
  it("ao abrir mostra todas as opções", async () => {
    render(<Campo />);

    await userEvent.click(campo());

    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("digitar filtra ignorando acento e maiúscula, e exige todas as palavras", async () => {
    render(<Campo />);
    const usuario = userEvent.setup();

    await usuario.type(campo(), "sao pau");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "São Paulo" })).toBeInTheDocument();

    await usuario.clear(campo());
    await usuario.type(campo(), "RIO janeiro");
    expect(screen.getByRole("option", { name: "Rio de Janeiro" })).toBeInTheDocument();
  });

  it("sem resultado avisa", async () => {
    render(<Campo />);

    await userEvent.type(campo(), "xyz");

    expect(screen.getByText("Nenhum resultado.")).toBeInTheDocument();
  });

  it("clicar numa opção escolhe, fecha a lista e mostra o nome no campo", async () => {
    const aoMudar = vi.fn();
    render(<Campo aoMudar={aoMudar} />);
    const usuario = userEvent.setup();

    await usuario.click(campo());
    await usuario.click(screen.getByRole("option", { name: "Santa Catarina" }));

    expect(aoMudar).toHaveBeenCalledWith("c");
    expect(campo()).toHaveValue("Santa Catarina");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("setas e Enter escolhem sem o mouse", async () => {
    const aoMudar = vi.fn();
    render(<Campo aoMudar={aoMudar} />);
    const usuario = userEvent.setup();

    await usuario.click(campo());
    await usuario.keyboard("{ArrowDown}{Enter}");

    expect(aoMudar).toHaveBeenCalledWith("b");
  });

  it("Escape fecha a lista; sair do campo sem escolher descarta o que foi digitado", async () => {
    render(<Campo />);
    const usuario = userEvent.setup();

    await usuario.type(campo(), "rio");
    await usuario.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await usuario.tab();
    expect(campo()).toHaveValue("");
  });

  it("com muitas opções mostra só as primeiras e pede para afinar a busca", async () => {
    const muitas = Array.from({ length: 150 }, (_, i) => ({ codigo: String(i), nome: `Item ${i}` }));
    render(<Campo opcoes={muitas} />);

    await userEvent.click(campo());

    expect(screen.getAllByRole("option")).toHaveLength(100);
    expect(screen.getByText(/Mostrando 100 de 150/)).toBeInTheDocument();
  });

  it("desabilitado não abre a lista", async () => {
    render(<ListaComBusca rotulo="Estado" placeholder="x" valor="" opcoes={OPCOES} desabilitado onChange={() => {}} />);

    await userEvent.click(campo());

    expect(campo()).toBeDisabled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
