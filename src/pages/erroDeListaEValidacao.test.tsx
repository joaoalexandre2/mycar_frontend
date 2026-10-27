import { afterEach, describe, expect, it, vi } from "vitest";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NotificacoesProvider } from "../contexts/NotificacoesProvider";
import { useCarregarLista } from "../hooks/useCarregarLista";
import { clientesService } from "../services/clientes";
import { Clientes } from "./Clientes/Clientes";
import { ClienteModal } from "./Clientes/ClienteModal";
import { OrdemServicoModal } from "./OrdensServico/OrdemServicoModal";

const respostaVazia = {
  dados: [],
  paginaAtual: 1,
  totalPaginas: 1,
  totalRegistros: 0,
  resumo: { total: 0, ativos: 0, inativos: 0, totalVeiculos: 0 },
};

describe("useCarregarLista guarda a falha", () => {
  it("devolve a mensagem de erro e limpa quando a carga seguinte dá certo", async () => {
    let falhar = true;
    const carregar = vi.fn(async () => {
      if (falhar) throw new Error("Servidor fora do ar");
    });

    const { result } = renderHook(() => useCarregarLista("lista", carregar));

    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.erro).toBeTruthy();

    falhar = false;
    result.current.recarregar();

    await waitFor(() => expect(carregar).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.erro).toBeNull());
  });
});

describe("lista de clientes com falha ao carregar", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function abrir() {
    return render(
      <NotificacoesProvider>
        <MemoryRouter>
          <Clientes />
        </MemoryRouter>
      </NotificacoesProvider>,
    );
  }

  it("mostra o erro com Tentar de novo, e não 'nenhum cliente'", async () => {
    const listar = vi
      .spyOn(clientesService, "listarPaginado")
      .mockRejectedValueOnce(new Error("rede fora do ar"))
      .mockResolvedValue(respostaVazia);

    abrir();

    expect(
      await screen.findByText("Não foi possível carregar a lista."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Nenhum cliente encontrado.")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    // Na segunda tentativa a lista vem vazia de verdade: aí sim o texto aparece.
    expect(await screen.findByText("Nenhum cliente encontrado.")).toBeInTheDocument();
    expect(screen.queryByText("Não foi possível carregar a lista.")).not.toBeInTheDocument();
    expect(listar).toHaveBeenCalledTimes(2);
  });
});

describe("validação por campo nos modais", () => {
  it("cliente: CPF incompleto mostra o erro no campo, marca como inválido e foca nele", async () => {
    const aoSalvar = vi.fn();

    render(
      <NotificacoesProvider>
        <ClienteModal cliente={null} onClose={vi.fn()} onSave={aoSalvar} />
      </NotificacoesProvider>,
    );

    await userEvent.type(screen.getByLabelText("Nome completo"), "Maria Souza");
    await userEvent.type(screen.getByLabelText("CPF"), "123");
    await userEvent.type(screen.getByLabelText("Telefone"), "(51) 99999-0000");
    await userEvent.click(screen.getByRole("button", { name: "Criar cliente" }));

    const cpf = screen.getByLabelText("CPF");

    expect(await screen.findByText("O CPF precisa ter 11 dígitos.")).toBeInTheDocument();
    expect(cpf).toHaveAttribute("aria-invalid", "true");
    expect(cpf).toHaveAccessibleDescription("O CPF precisa ter 11 dígitos.");
    expect(cpf).toHaveFocus();
    expect(aoSalvar).not.toHaveBeenCalled();

    // Voltar a digitar no campo tira o erro dele.
    await userEvent.type(cpf, "4");

    expect(screen.queryByText("O CPF precisa ter 11 dígitos.")).not.toBeInTheDocument();
    expect(cpf).not.toHaveAttribute("aria-invalid");
  });

  it("ordem de serviço: sem veículo, o erro aparece no campo e ele recebe o foco", async () => {
    const aoSalvar = vi.fn();

    render(
      <NotificacoesProvider>
        <OrdemServicoModal ordem={null} onClose={vi.fn()} onSave={aoSalvar} />
      </NotificacoesProvider>,
    );

    await userEvent.type(
      screen.getByLabelText("Descrição do problema / serviço"),
      "Barulho na suspensão",
    );
    await userEvent.type(screen.getByLabelText("Valor"), "250");
    await userEvent.click(screen.getByRole("button", { name: "Criar ordem" }));

    const veiculo = screen.getByRole("combobox", { name: "Veículo" });

    expect(await screen.findByText("Escolha o veículo da ordem.")).toBeInTheDocument();
    expect(veiculo).toHaveAttribute("aria-invalid", "true");
    expect(veiculo).toHaveFocus();
    expect(aoSalvar).not.toHaveBeenCalled();
  });
});
