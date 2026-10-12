import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SelectComBusca, type OpcaoBusca } from "./SelectComBusca";

const CLIENTES: OpcaoBusca[] = [
  { id: 1, rotulo: "Ana Souza" },
  { id: 2, rotulo: "Bruno Lima" },
  { id: 3, rotulo: "Carla Dias" },
];

function Campo({
  buscar,
  rotuloInicial,
  inicial = "",
  aoMudar = () => {},
}: {
  buscar: (termo: string) => Promise<OpcaoBusca[]>;
  rotuloInicial?: string;
  inicial?: string;
  aoMudar?: (id: string) => void;
}) {
  const [valor, setValor] = useState(inicial);

  return (
    <SelectComBusca
      valor={valor}
      rotuloInicial={rotuloInicial}
      placeholder="Busque o cliente"
      buscar={buscar}
      onChange={(id) => {
        setValor(id);
        aoMudar(id);
      }}
    />
  );
}

function buscaFalsa() {
  return vi.fn(async (termo: string) =>
    CLIENTES.filter((c) => c.rotulo.toLowerCase().includes(termo.toLowerCase())),
  );
}

describe("SelectComBusca", () => {
  it("ao abrir mostra os primeiros itens (busca vazia)", async () => {
    const buscar = buscaFalsa();
    render(<Campo buscar={buscar} />);

    await userEvent.click(screen.getByRole("combobox"));

    expect(await screen.findByRole("option", { name: "Ana Souza" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(buscar).toHaveBeenCalledWith("");
  });

  it("busca no servidor pelo que foi digitado, depois de uma pequena espera", async () => {
    const buscar = buscaFalsa();
    render(<Campo buscar={buscar} />);

    await userEvent.type(screen.getByRole("combobox"), "bru");

    await waitFor(() => expect(buscar).toHaveBeenCalledWith("bru"));
    expect(await screen.findAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Bruno Lima" })).toBeInTheDocument();
    // Não consultou a cada tecla.
    expect(buscar).not.toHaveBeenCalledWith("b");
    expect(buscar).not.toHaveBeenCalledWith("br");
  });

  it("escolher um item devolve o id e mostra o nome no campo", async () => {
    const aoMudar = vi.fn();
    render(<Campo buscar={buscaFalsa()} aoMudar={aoMudar} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByRole("option", { name: "Carla Dias" }));

    expect(aoMudar).toHaveBeenCalledWith("3");
    expect(screen.getByRole("combobox")).toHaveValue("Carla Dias");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("mostra o item já selecionado ao editar e, ao abrir, lista os primeiros itens", async () => {
    const buscar = buscaFalsa();
    render(<Campo buscar={buscar} inicial="2" rotuloInicial="Bruno Lima" />);

    expect(screen.getByRole("combobox")).toHaveValue("Bruno Lima");

    await userEvent.click(screen.getByRole("combobox"));

    // Não filtra pelo nome do item já escolhido.
    expect(await screen.findAllByRole("option")).toHaveLength(3);
    expect(buscar).toHaveBeenCalledWith("");
  });

  it("digitar de novo limpa a escolha anterior", async () => {
    const aoMudar = vi.fn();
    render(<Campo buscar={buscaFalsa()} inicial="2" rotuloInicial="Bruno Lima" aoMudar={aoMudar} />);

    await userEvent.type(screen.getByRole("combobox"), "x");

    expect(aoMudar).toHaveBeenCalledWith("");
  });

  it("sair do campo sem escolher limpa o texto digitado", async () => {
    render(<Campo buscar={buscaFalsa()} />);

    await userEvent.type(screen.getByRole("combobox"), "ana");
    await userEvent.tab();

    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("avisa quando não há resultado", async () => {
    render(<Campo buscar={buscaFalsa()} />);

    await userEvent.type(screen.getByRole("combobox"), "zzz");

    expect(await screen.findByText("Nenhum resultado.")).toBeInTheDocument();
  });

  it("avisa quando a busca falha", async () => {
    const buscar = vi.fn(async () => {
      throw new Error("rede fora do ar");
    });
    render(<Campo buscar={buscar} />);

    await userEvent.click(screen.getByRole("combobox"));

    expect(await screen.findByText("Não foi possível buscar agora.")).toBeInTheDocument();
  });

  it("teclado: seta para baixo e Enter escolhem sem enviar o formulário", async () => {
    const aoMudar = vi.fn();
    const aoEnviar = vi.fn((evento: React.FormEvent) => evento.preventDefault());

    render(
      <form onSubmit={aoEnviar}>
        <Campo buscar={buscaFalsa()} aoMudar={aoMudar} />
      </form>,
    );

    await userEvent.click(screen.getByRole("combobox"));
    await screen.findAllByRole("option");
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(aoMudar).toHaveBeenCalledWith("2");
    expect(aoEnviar).not.toHaveBeenCalled();
  });

  it("uma resposta antiga não sobrescreve a mais nova", async () => {
    let liberarLenta!: (opcoes: OpcaoBusca[]) => void;
    const buscar = vi.fn((termo: string) => {
      if (termo === "") {
        return new Promise<OpcaoBusca[]>((resolve) => {
          liberarLenta = resolve;
        });
      }
      return Promise.resolve([{ id: 2, rotulo: "Bruno Lima" }]);
    });

    render(<Campo buscar={buscar} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByRole("combobox"), "bru");

    expect(await screen.findByRole("option", { name: "Bruno Lima" })).toBeInTheDocument();

    // A busca vazia (mais antiga) termina por último e não pode trocar a lista.
    liberarLenta(CLIENTES);

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(1);
    });
  });
});
