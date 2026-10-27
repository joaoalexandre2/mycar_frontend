import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import type { OrdemServico } from "../../types/ordemServico";
import type { Cliente } from "../../types/cliente";
import { OrdemServicoDetalhes } from "./OrdemServicoDetalhes";
import { OrdemServicoModal } from "./OrdemServicoModal";
import { ClienteModal } from "../Clientes/ClienteModal";

const ordem: OrdemServico = {
  id: 12,
  veiculoId: 3,
  descricao: "Barulho na suspensão dianteira",
  status: "em_andamento",
  valor: 480,
  dataAbertura: "2026-10-05",
  dataFechamento: null,
  veiculo: {
    id: 3,
    clienteId: 1,
    tipoVeiculo: "carro",
    placa: "ABC1D23",
    marca: "Fiat",
    modelo: "Uno",
    ano: 2018,
    anoFabricacao: null,
    anoCompleto: "2018",
    isentoIpva: false,
    possivelIsencaoIpva: false,
    uf: "RS",
    ipvaEstimado: null,
    licenciamentoValor: null,
    proximoVencimentoLicenciamento: null,
    fipeMarcaId: null,
    fipeModeloId: null,
    fipeAno: null,
    fipeValor: null,
    fipeConsultadoEm: null,
    cliente: { id: 1, nome: "Maria Souza", telefone: "(51) 99999-0000" },
  },
};

function renderDetalhes(
  sobrescrever: Partial<React.ComponentProps<typeof OrdemServicoDetalhes>> = {},
) {
  const props = {
    ordem,
    onVoltar: vi.fn(),
    onEditar: vi.fn(),
    onConcluir: vi.fn(),
    ...sobrescrever,
  };

  render(<OrdemServicoDetalhes {...props} />);

  return props;
}

describe("detalhe da ordem de serviço", () => {
  it("mostra só dados da ordem: nada de serviço ou histórico inventado", async () => {
    renderDetalhes();

    expect(screen.queryByText(/Diagnóstico do motor/)).not.toBeInTheDocument();
    expect(screen.queryByText(/350,00/)).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Serviços" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Peças" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Histórico" }));

    expect(screen.queryByText(/24\/08\/2026/)).not.toBeInTheDocument();
    expect(screen.getByText("05/10/2026")).toBeInTheDocument();
    expect(screen.getByText("Situação atual da ordem.")).toBeInTheDocument();
  });

  it("Editar e Concluir OS chamam as ações", async () => {
    const props = renderDetalhes();

    await userEvent.click(screen.getByRole("button", { name: "Editar" }));
    await userEvent.click(screen.getByRole("button", { name: "Concluir OS" }));

    expect(props.onEditar).toHaveBeenCalledTimes(1);
    expect(props.onConcluir).toHaveBeenCalledTimes(1);
  });

  it("não oferece Concluir OS numa ordem já finalizada", () => {
    renderDetalhes({
      ordem: { ...ordem, status: "finalizada", dataFechamento: "2026-10-09" },
    });

    expect(screen.queryByRole("button", { name: "Concluir OS" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("o botão de voltar tem nome", async () => {
    const props = renderDetalhes();

    await userEvent.click(
      screen.getByRole("button", { name: /Voltar para a lista/ }),
    );

    expect(props.onVoltar).toHaveBeenCalledTimes(1);
  });
});

describe("modal de ordem de serviço", () => {
  it("os campos são achados pelo rótulo", () => {
    render(
      <NotificacoesProvider>
        <OrdemServicoModal ordem={null} onClose={vi.fn()} onSave={vi.fn()} />
      </NotificacoesProvider>,
    );

    expect(screen.getByLabelText("Veículo")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição do problema / serviço")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor")).toBeInTheDocument();
    expect(screen.getByLabelText("Data de abertura")).toBeInTheDocument();
  });

  it("clique duplo salva uma vez só e o botão mostra Salvando...", async () => {
    let concluir: () => void = () => {};
    const aoSalvar = vi.fn(
      () => new Promise<void>((resolve) => (concluir = resolve)),
    );

    render(
      <NotificacoesProvider>
        <OrdemServicoModal
          ordem={{ ...ordem, valor: 480 }}
          onClose={vi.fn()}
          onSave={aoSalvar}
        />
      </NotificacoesProvider>,
    );

    const botao = screen.getByRole("button", { name: "Salvar alterações" });

    await userEvent.dblClick(botao);

    expect(aoSalvar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();

    concluir();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Salvar alterações" }),
      ).toBeEnabled(),
    );
  });
});

describe("modal de cliente", () => {
  const cliente: Cliente = {
    id: 1,
    nome: "Maria Souza",
    cpf: "12345678901",
    telefone: "(51) 99999-0000",
    email: null,
    ativo: true,
    quantidadeVeiculos: 0,
    dataCadastro: "2026-01-01",
  };

  it("os campos são achados pelo rótulo", () => {
    render(
      <NotificacoesProvider>
        <ClienteModal cliente={null} onClose={vi.fn()} onSave={vi.fn()} />
      </NotificacoesProvider>,
    );

    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByLabelText("CPF")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone")).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("clique duplo cria um cliente só", async () => {
    let concluir: () => void = () => {};
    const aoSalvar = vi.fn(
      () => new Promise<void>((resolve) => (concluir = resolve)),
    );

    render(
      <NotificacoesProvider>
        <ClienteModal cliente={cliente} onClose={vi.fn()} onSave={aoSalvar} />
      </NotificacoesProvider>,
    );

    await userEvent.dblClick(
      screen.getByRole("button", { name: "Salvar alterações" }),
    );

    expect(aoSalvar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();

    concluir();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Salvar alterações" }),
      ).toBeEnabled(),
    );
  });
});
