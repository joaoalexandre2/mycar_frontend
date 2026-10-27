import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NotificacoesProvider } from "../contexts/NotificacoesProvider";
import { AuthContext } from "../contexts/authContextDefinition";
import type { Usuario } from "../types/auth";
import type { Manutencao } from "../types/manutencao";
import { configuracaoService } from "../services/configuracao";
import { fichaTecnicaService } from "../services/fichaTecnica";
import { pecasService } from "../services/pecas";
import { ClienteModal } from "./Clientes/ClienteModal";
import { OrdemServicoModal } from "./OrdensServico/OrdemServicoModal";
import { ManutencaoModal } from "./Manutencoes/ManutencaoModal";
import { Configuracoes } from "./Configuracoes/Configuracoes";
import { PecasCard } from "./Veiculos/PecasCard";
import { FichaTecnicaCard } from "./Veiculos/FichaTecnicaCard";

const oficina: Usuario = { id: 1, name: "Oficina", email: "o@mycar.local", perfil: "oficina" };

function comProviders(filho: React.ReactNode) {
  return render(
    <AuthContext.Provider
      value={{
        usuario: oficina,
        autenticado: true,
        entrar: async () => {},
        sair: async () => {},
        atualizarUsuario: () => {},
      }}
    >
      <NotificacoesProvider>
        <MemoryRouter>{filho}</MemoryRouter>
      </NotificacoesProvider>
    </AuthContext.Provider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

// R2: com `noValidate`, a bolha nativa do navegador não passa na frente das
// mensagens junto do campo.
describe("campos vazios mostram a mensagem do app, não a do navegador", () => {
  it("cliente: formulário vazio aponta nome, CPF e telefone e foca o primeiro", async () => {
    const aoSalvar = vi.fn();

    comProviders(<ClienteModal cliente={null} onClose={vi.fn()} onSave={aoSalvar} />);

    await userEvent.click(screen.getByRole("button", { name: "Criar cliente" }));

    expect(await screen.findByText("Informe o nome do cliente.")).toBeInTheDocument();
    expect(screen.getByText("O CPF precisa ter 11 dígitos.")).toBeInTheDocument();
    expect(screen.getByText("Informe o telefone.")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toHaveFocus();
    expect(aoSalvar).not.toHaveBeenCalled();
  });

  it("cliente: e-mail preenchido e inválido é recusado; vazio é aceito", async () => {
    const aoSalvar = vi.fn();

    comProviders(<ClienteModal cliente={null} onClose={vi.fn()} onSave={aoSalvar} />);

    await userEvent.type(screen.getByLabelText("Nome completo"), "Maria Souza");
    await userEvent.type(screen.getByLabelText("CPF"), "12345678901");
    await userEvent.type(screen.getByLabelText("Telefone"), "(51) 99999-0000");
    await userEvent.type(screen.getByLabelText("E-mail"), "maria@");
    await userEvent.click(screen.getByRole("button", { name: "Criar cliente" }));

    expect(
      await screen.findByText("Informe um e-mail válido, como nome@exemplo.com."),
    ).toBeInTheDocument();
    expect(aoSalvar).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText("E-mail"));
    await userEvent.click(screen.getByRole("button", { name: "Criar cliente" }));

    await waitFor(() => expect(aoSalvar).toHaveBeenCalledTimes(1));
  });

  it("ordem de serviço: valor vazio mostra a mensagem do app", async () => {
    comProviders(<OrdemServicoModal ordem={null} onClose={vi.fn()} onSave={vi.fn()} />);

    await userEvent.type(
      screen.getByLabelText("Descrição do problema / serviço"),
      "Barulho na suspensão",
    );
    await userEvent.click(screen.getByRole("button", { name: "Criar ordem" }));

    expect(await screen.findByText("Informe o valor da ordem.")).toBeInTheDocument();
    expect(screen.getByLabelText("Valor")).toHaveAttribute("aria-invalid", "true");
  });
});

// R3: o erro das peças some quando a pessoa mexe nelas.
describe("manutenção: erro das peças", () => {
  const manutencao: Manutencao = {
    id: 5,
    veiculoId: 3,
    tipo: "Troca de óleo",
    descricao: "Óleo e filtro",
    valor: null,
    dataManutencao: "2026-10-01",
    quilometragem: null,
    proximaData: null,
    proximaQuilometragem: null,
    status: "em_dia",
    pecas: [],
  };

  it("some ao corrigir a linha", async () => {
    vi.spyOn(pecasService, "listar").mockResolvedValue({
      tipos: { filtro_oleo: "Filtro de óleo" },
      pecas: [],
    } as never);

    comProviders(
      <ManutencaoModal manutencao={manutencao} onClose={vi.fn()} onSave={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole("button", { name: /Adicionar/ }));
    // Linha pela metade: só a marca, sem tipo nem código.
    await userEvent.type(screen.getByLabelText("Marca da peça"), "Fram");
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    const mensagem =
      "Em cada peça, escolha o tipo e informe o código ou a especificação (ou remova a linha).";

    expect(await screen.findByText(mensagem)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Código ou especificação da peça"), "PH5949");

    expect(screen.queryByText(mensagem)).not.toBeInTheDocument();
  });
});

// R4: se a carga falhar, salvar apagaria os dados reais.
describe("Configurações: falha ao carregar a oficina", () => {
  it("desabilita os campos e o botão, e volta ao normal ao tentar de novo", async () => {
    const dados = {
      nome: "Auto Center",
      cnpj: "12345678000190",
      telefone: "(51) 3333-0000",
      endereco: "Rua A, 10",
      resumo_semanal: true,
    };
    const buscar = vi
      .spyOn(configuracaoService, "buscarOficina")
      .mockRejectedValueOnce(new Error("rede fora do ar"))
      .mockResolvedValue(dados as never);
    const salvar = vi.spyOn(configuracaoService, "atualizarOficina");

    comProviders(<Configuracoes />);

    await userEvent.click(screen.getByRole("button", { name: /Oficina/ }));

    expect(
      await screen.findByText("Não foi possível carregar os dados da oficina."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome da oficina")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Salvar oficina" })).toBeDisabled();
    expect(salvar).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    await waitFor(() => expect(screen.getByLabelText("Nome da oficina")).toBeEnabled());
    expect(screen.getByLabelText("Nome da oficina")).toHaveValue("Auto Center");
    expect(screen.getByRole("button", { name: "Salvar oficina" })).toBeEnabled();
    expect(buscar).toHaveBeenCalledTimes(2);
  });
});

// R8: o falso "vazio" quando a carga falha.
describe("cartões do veículo com falha ao carregar", () => {
  it("peças: mostra o erro e não 'nenhuma peça registrada'", async () => {
    vi.spyOn(pecasService, "listar")
      .mockRejectedValueOnce(new Error("rede fora do ar"))
      .mockResolvedValue({ tipos: {}, pecas: [] } as never);

    comProviders(<PecasCard veiculoId={3} />);

    expect(await screen.findByText("Não foi possível carregar as peças.")).toBeInTheDocument();
    expect(screen.queryByText(/Nenhuma peça registrada/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText(/Nenhuma peça registrada/)).toBeInTheDocument();
  });

  it("peças: a validação do formulário fica no card, não num toast", async () => {
    vi.spyOn(pecasService, "listar").mockResolvedValue({
      tipos: { filtro_oleo: "Filtro de óleo" },
      pecas: [],
    } as never);

    comProviders(<PecasCard veiculoId={3} />);

    await userEvent.click(await screen.findByRole("button", { name: /Registrar peça/ }));
    await userEvent.click(screen.getByRole("button", { name: "Registrar" }));

    expect(
      await screen.findByText("Escolha o tipo e informe o código ou a especificação."),
    ).toBeInTheDocument();
  });

  it("ficha técnica: mostra o erro, esconde Preencher e não diz 'nenhuma ficha'", async () => {
    vi.spyOn(fichaTecnicaService, "buscar")
      .mockRejectedValueOnce(new Error("rede fora do ar"))
      .mockResolvedValue({ dados: null } as never);

    comProviders(<FichaTecnicaCard veiculoId={3} />);

    expect(
      await screen.findByText("Não foi possível carregar a ficha técnica."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Preencher" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Nenhuma ficha técnica cadastrada/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText(/Nenhuma ficha técnica cadastrada/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preencher" })).toBeInTheDocument();
  });
});
