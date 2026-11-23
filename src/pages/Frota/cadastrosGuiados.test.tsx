import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type AxiosResponse } from "axios";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { centrosCustoService, gruposUsuariosService, motivosTrocaCentroService, motoristasService } from "../../services/frota";
import { Cadastros } from "./Cadastros";
import { ConfiguracoesFrota } from "./ConfiguracoesFrota";
import type { CentroCusto, Motorista } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const ana: Motorista = { id: 1, nome: "Ana Lima", telefone: null, cnhNumero: null, cnhValidade: null, ativo: true };
const vendas: CentroCusto = { id: 1, nome: "Vendas", codigo: null, ativo: true };

/** O 422 que o servidor devolve quando o cadastro tem histórico (nada é apagado). */
function recusaPorHistorico(mensagem: string) {
  return new AxiosError("422", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 422,
    data: { message: mensagem },
  } as AxiosResponse);
}

function tela(ui: React.ReactNode, permissoes?: string[]) {
  const conteudo = <NotificacoesProvider>{ui}</NotificacoesProvider>;

  if (!permissoes) return render(conteudo);

  const valor = {
    usuario: { id: 1, name: "Ana", email: "ana@x.com", perfil: "frota", papel: "gestor", permissoes },
    autenticado: true,
  } as unknown as AuthContextValor;

  return render(<AuthContext.Provider value={valor}>{conteudo}</AuthContext.Provider>);
}

async function confirmarRemocao(nome: string) {
  await userEvent.click(await screen.findByRole("button", { name: `Remover ${nome}` }));
  const dialogo = await screen.findByRole("alertdialog");
  return dialogo;
}

describe("Cadastros: remover com histórico vira desativar", () => {
  it("a confirmação já avisa que, com histórico, o motorista não é apagado", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([ana]);
    tela(<Cadastros />);

    const dialogo = await confirmarRemocao("Ana Lima");

    expect(dialogo).toHaveTextContent(/não apaga o cadastro e você poderá desativá-lo/);
  });

  it("a recusa do servidor explica e oferece Desativar na própria mensagem", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([ana]);
    vi.spyOn(motoristasService, "remover").mockRejectedValue(
      recusaPorHistorico("Este motorista tem usos de veículo no histórico. Desative-o em vez de apagar."),
    );
    const atualizar = vi.spyOn(motoristasService, "atualizar").mockResolvedValue({ ...ana, ativo: false });
    tela(<Cadastros />);

    const dialogo = await confirmarRemocao("Ana Lima");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Remover" }));

    const aviso = await screen.findByText(/tem usos de veículo no histórico/);
    const caixa = aviso.closest("[data-tom]") as HTMLElement;
    expect(caixa).toHaveAttribute("data-tom", "warning");
    expect(caixa).toHaveTextContent(/dá para reativar depois/);

    await userEvent.click(within(caixa).getByRole("button", { name: "Desativar Ana Lima" }));

    await waitFor(() => expect(atualizar).toHaveBeenCalledWith(1, { nome: "Ana Lima", ativo: false }));
    await waitFor(() => expect(screen.queryByText(/tem usos de veículo no histórico/)).not.toBeInTheDocument());
  });

  it("se o motorista já está desativado, não oferece desativar de novo", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([{ ...ana, ativo: false }]);
    vi.spyOn(motoristasService, "remover").mockRejectedValue(recusaPorHistorico("Este motorista tem usos."));
    tela(<Cadastros />);

    const dialogo = await confirmarRemocao("Ana Lima");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Remover" }));

    expect(await screen.findByText(/já está desativado/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desativar Ana Lima" })).not.toBeInTheDocument();
  });

  it("outro erro ao remover continua como erro comum", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([ana]);
    vi.spyOn(motoristasService, "remover").mockRejectedValue(new Error("rede fora"));
    tela(<Cadastros />);

    const dialogo = await confirmarRemocao("Ana Lima");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Remover" }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desativar Ana Lima" })).not.toBeInTheDocument();
  });

  it("vale também para o centro de custo", async () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas]);
    vi.spyOn(centrosCustoService, "remover").mockRejectedValue(
      recusaPorHistorico("Este centro de custo tem veículos ou usos ligados a ele. Desative-o em vez de apagar, para manter o histórico."),
    );
    const atualizar = vi.spyOn(centrosCustoService, "atualizar").mockResolvedValue({ ...vendas, ativo: false });
    tela(<Cadastros />, ["centros_custo"]);

    const dialogo = await confirmarRemocao("Vendas");
    expect(dialogo).toHaveTextContent(/veículos ou usos ligados/);
    await userEvent.click(within(dialogo).getByRole("button", { name: "Remover" }));

    await userEvent.click(await screen.findByRole("button", { name: "Desativar Vendas" }));

    await waitFor(() => expect(atualizar).toHaveBeenCalledWith(1, { nome: "Vendas", codigo: null, ativo: false }));
  });
});

describe("Cadastros: motorista sem centro de custo cadastrado", () => {
  it("explica e cria o centro ali mesmo, sem perder o que foi digitado", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([]);
    const criarCentro = vi.spyOn(centrosCustoService, "criar").mockResolvedValue({ id: 9, nome: "Entregas", codigo: null, ativo: true });
    const criarMotorista = vi.spyOn(motoristasService, "criar").mockResolvedValue(ana);
    const usuario = userEvent.setup();
    tela(<Cadastros />);

    await usuario.click(await screen.findByRole("button", { name: /Novo motorista/ }));
    await usuario.type(screen.getByLabelText("Nome"), "Bruno");

    const aviso = await screen.findByText(/Ainda não há centro de custo ativo/);
    expect(aviso.closest("[data-tom]")).toHaveAttribute("data-tom", "info");

    await usuario.click(screen.getByRole("button", { name: "Cadastrar centro de custo" }));

    const dialogoCentro = screen.getByRole("dialog", { name: /Novo centro de custo/ });
    await usuario.type(within(dialogoCentro).getByLabelText("Nome"), "Entregas");
    await usuario.click(within(dialogoCentro).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(criarCentro).toHaveBeenCalledWith({ nome: "Entregas", codigo: null }));
    expect(screen.queryByRole("dialog", { name: /Novo centro de custo/ })).not.toBeInTheDocument();
    // O submit do centro não salvou o motorista junto.
    expect(criarMotorista).not.toHaveBeenCalled();

    const dialogoMotorista = screen.getByRole("dialog", { name: /Novo motorista/ });
    expect(within(dialogoMotorista).getByLabelText("Nome")).toHaveValue("Bruno");
    expect(within(dialogoMotorista).getByLabelText("Centro de custo")).toHaveValue("9");
    expect(screen.queryByText(/Ainda não há centro de custo ativo/)).not.toBeInTheDocument();

    await usuario.click(within(dialogoMotorista).getByRole("button", { name: "Salvar" }));
    await waitFor(() =>
      expect(criarMotorista).toHaveBeenCalledWith(expect.objectContaining({ nome: "Bruno", centro_custo_id: 9 })),
    );
  });

  it("sem permissão de centros, só explica a quem pedir", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([]);
    tela(<Cadastros />, ["motoristas"]);

    await userEvent.click(await screen.findByRole("button", { name: /Novo motorista/ }));

    expect(await screen.findByText(/Peça a quem gerencia os centros de custo/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cadastrar centro de custo" })).not.toBeInTheDocument();
  });

  it("com centro cadastrado, não mostra o aviso", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas]);
    tela(<Cadastros />);

    await userEvent.click(await screen.findByRole("button", { name: /Novo motorista/ }));

    await screen.findByRole("option", { name: "Vendas" });
    expect(screen.queryByText(/Ainda não há centro de custo ativo/)).not.toBeInTheDocument();
  });
});

describe("Títulos e abas de Cadastros e Gestão da frota", () => {
  it("Cadastros não repete o título do cabeçalho e usa abas acessíveis", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    tela(<Cadastros />);

    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Motoristas e centros de custo" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Motoristas");
    expect(await screen.findByText(/Nenhum motorista cadastrado/)).toBeInTheDocument();
  });

  it("Gestão da frota não repete o título e anda pelas abas com as setas", async () => {
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([]);
    vi.spyOn(gruposUsuariosService, "listar").mockResolvedValue({ grupos: [], catalogo: {}, menus: {}, usuarios: [] });
    const usuario = userEvent.setup();
    tela(<ConfiguracoesFrota />, ["centros_custo", "grupos"]);

    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
    const motivos = screen.getByRole("tab", { name: /Motivos de troca/ });
    expect(motivos).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName(/Motivos de troca/);

    motivos.focus();
    await usuario.keyboard("{ArrowRight}");

    const grupos = screen.getByRole("tab", { name: /Grupos de usuários/ });
    expect(grupos).toHaveFocus();
    expect(grupos).toHaveAttribute("aria-selected", "true");
    expect(motivos).toHaveAttribute("tabindex", "-1");
  });
});
