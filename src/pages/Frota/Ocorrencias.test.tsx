import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { conferirTabelaCartoes } from "../../test/tabelaCartoes";
import userEvent from "@testing-library/user-event";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { contaService } from "../../services/conta/veiculos";
import { ocorrenciasService } from "../../services/ocorrencias";
import type { Ocorrencia, ResumoDeOcorrencias } from "../../types/ocorrencias";
import { Ocorrencias } from "./Ocorrencias";

// O redimensionamento usa canvas, que o jsdom não tem: aqui a foto segue como veio.
vi.mock("../../utils/imagem", async (original) => ({
  ...(await original<typeof import("../../utils/imagem")>()),
  redimensionar: async (arquivo: File) => arquivo,
}));

afterEach(() => vi.restoreAllMocks());

const ocorrencia: Ocorrencia = {
  id: 7,
  tipo: "avaria",
  tipoRotulo: "Avaria",
  status: "aberta",
  statusRotulo: "Aberta",
  dataHora: "2026-11-09T08:00:00-03:00",
  local: "Pátio",
  descricao: "Retrovisor quebrado",
  veiculo: { id: 1, placa: "AAA1A11" },
  motorista: { id: 2, nome: "João" },
  fotos: [],
  prejuizoEstimado: 500,
  valorGasto: null,
  despesaId: null,
};

const resumo: ResumoDeOcorrencias = {
  total: 1,
  abertas: 1,
  porStatus: { aberta: 1, em_analise: 0, aguardando_orcamento: 0, em_reparo: 0, concluida: 0, cancelada: 0 },
  prejuizoTotal: 500,
  gastoTotal: 0,
};

function renderizar(papel: string) {
  const valor = {
    usuario: { id: 1, name: "Ana", email: "ana@x.com", perfil: "frota", papel },
    autenticado: true,
  } as unknown as AuthContextValor;

  return render(
    <AuthContext.Provider value={valor}>
      <NotificacoesProvider>
        <Ocorrencias />
      </NotificacoesProvider>
    </AuthContext.Provider>,
  );
}

function prepararServicos() {
  vi.spyOn(ocorrenciasService, "listar").mockResolvedValue({ dados: [ocorrencia], paginaAtual: 1, totalPaginas: 1, totalRegistros: 1, resumo });
  vi.spyOn(contaService, "listarVeiculos").mockResolvedValue({ dados: [{ id: 1, placa: "AAA1A11", marca: "Fiat", modelo: "Strada" }], paginaAtual: 1, totalPaginas: 1, totalRegistros: 1 } as never);
}

describe("Ocorrências da frota", () => {
  it("gestor vê a ocorrência, o prejuízo estimado e a coluna de gasto", async () => {
    prepararServicos();

    renderizar("gestor");

    expect(await screen.findByText("Retrovisor quebrado")).toBeInTheDocument();
    expect(screen.getByText("Prejuízo estimado")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Gasto" })).toBeInTheDocument();
  });

  it("motorista não vê valores", async () => {
    prepararServicos();

    renderizar("motorista");

    expect(await screen.findByText("Retrovisor quebrado")).toBeInTheDocument();
    expect(screen.queryByText("Prejuízo estimado")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Gasto" })).not.toBeInTheDocument();
  });

  it.each(["gestor", "motorista"])("a tabela vira cartões no celular com o rótulo de cada coluna (%s)", async (papel) => {
    prepararServicos();

    renderizar(papel);

    await screen.findByText("Retrovisor quebrado");
    const tabela = screen.getByRole("table");
    conferirTabelaCartoes(tabela as HTMLTableElement);
    expect(within(tabela).getByText("Retrovisor quebrado").closest("td")).toHaveAttribute("data-label", "O que aconteceu");

    // As ações continuam alcançáveis pelo nome e ganham alvo de toque maior no celular.
    const acoes = within(tabela).getAllByRole("button");
    expect(acoes).toHaveLength(papel === "gestor" ? 2 : 1);
    acoes.forEach((botao) => expect(botao).toHaveClass("max-md:h-11", "max-md:w-11"));
  });

  it.each([
    ["gestor", 8],
    ["motorista", 7],
  ])("a linha de lista vazia ocupa todas as colunas (%s)", async (papel, colunas) => {
    vi.spyOn(ocorrenciasService, "listar").mockResolvedValue({ dados: [], paginaAtual: 1, totalPaginas: 1, totalRegistros: 0, resumo });
    vi.spyOn(contaService, "listarVeiculos").mockResolvedValue({ dados: [], paginaAtual: 1, totalPaginas: 1, totalRegistros: 0 } as never);

    renderizar(papel);

    const vazio = await screen.findByText("Nenhuma ocorrência com esse filtro.");
    expect(vazio.closest("td")?.colSpan).toBe(colunas);
    conferirTabelaCartoes(screen.getByRole("table") as HTMLTableElement);
  });

  it("registra uma ocorrência com o horário digitado", async () => {
    prepararServicos();
    const criar = vi.spyOn(ocorrenciasService, "criar").mockResolvedValue(ocorrencia);
    const user = userEvent.setup();

    renderizar("motorista");

    await user.click(await screen.findByRole("button", { name: /Registrar ocorrência/ }));
    // Os filtros da lista têm os mesmos rótulos; o formulário é o último deles no documento.
    const ultimo = (rotuloDoCampo: string) => screen.getAllByLabelText(rotuloDoCampo).at(-1) as HTMLElement;
    await user.selectOptions(ultimo("Veículo"), "1");
    await user.selectOptions(ultimo("Tipo"), "acidente");
    fireEvent.change(screen.getByLabelText("Data e hora"), { target: { value: "2026-11-09T08:00" } });
    await user.type(screen.getByLabelText("O que aconteceu"), "Batida leve na traseira");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith(
        expect.objectContaining({ veiculoId: 1, tipo: "acidente", dataHora: "2026-11-09T08:00", descricao: "Batida leve na traseira" }),
      ),
    );
  });
});

describe("Ocorrências: fotos logo depois de registrar", () => {
  const criada: Ocorrencia = { ...ocorrencia, id: 42, descricao: "Batida leve na traseira", fotos: [] };

  async function registrar(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole("button", { name: /Registrar ocorrência/ }));
    const dialogo = screen.getByRole("dialog");
    await user.selectOptions(within(dialogo).getByLabelText("Veículo"), "1");
    fireEvent.change(within(dialogo).getByLabelText("Data e hora"), { target: { value: "2026-11-09T08:00" } });
    await user.type(within(dialogo).getByLabelText("O que aconteceu"), "Batida leve na traseira");
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    return dialogo;
  }

  it("ao criar, o modal fica aberto no registro novo, com as fotos habilitadas, e a lista atualiza por trás", async () => {
    prepararServicos();
    const listar = vi.mocked(ocorrenciasService.listar);
    vi.spyOn(ocorrenciasService, "criar").mockResolvedValue(criada);
    const enviarFoto = vi.spyOn(ocorrenciasService, "enviarFoto").mockResolvedValue({ id: 9, momento: "antes", url: "https://api.exemplo.com/f9" });
    const user = userEvent.setup();

    renderizar("motorista");
    await screen.findByText("Retrovisor quebrado");
    const chamadasAntes = listar.mock.calls.length;
    const dialogo = await registrar(user);

    const aviso = await within(dialogo).findByRole("status");
    expect(aviso).toHaveTextContent("Ocorrência registrada. Agora você pode anexar as fotos de antes e depois.");
    expect(aviso).toHaveFocus();
    expect(screen.getByRole("dialog")).toBe(dialogo);
    expect(within(dialogo).getByRole("region", { name: "Fotos" })).toBeInTheDocument();
    await waitFor(() => expect(listar.mock.calls.length).toBeGreaterThan(chamadasAntes));

    // O motorista não edita o que registrou: sem Salvar, dados só para leitura, e sem campos de gestão.
    expect(within(dialogo).queryByRole("button", { name: /^Salvar/ })).not.toBeInTheDocument();
    expect(within(dialogo).getByLabelText("O que aconteceu")).toBeDisabled();
    expect(within(dialogo).queryByLabelText("Status")).not.toBeInTheDocument();

    // A foto vai para o registro que acabou de ser criado.
    const arquivo = new File(["x"], "dano.jpg", { type: "image/jpeg" });
    await user.upload(within(dialogo).getByLabelText("Anexar foto antes do reparo"), arquivo);
    await waitFor(() => expect(enviarFoto).toHaveBeenCalledWith(42, "antes", expect.anything()));
    expect(await within(dialogo).findByRole("link", { name: "Ver foto de antes" })).toBeInTheDocument();
  });

  it("Concluir fecha o modal e a lista mostra o registro novo", async () => {
    prepararServicos();
    vi.spyOn(ocorrenciasService, "criar").mockImplementation(async () => {
      vi.mocked(ocorrenciasService.listar).mockResolvedValue({ dados: [criada, ocorrencia], paginaAtual: 1, totalPaginas: 1, totalRegistros: 2, resumo });
      return criada;
    });
    const user = userEvent.setup();

    renderizar("gestor");
    const dialogo = await registrar(user);
    await within(dialogo).findByRole("status");

    // Quem gerencia ainda pode ajustar o registro novo antes de concluir.
    expect(within(dialogo).getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
    await user.click(within(dialogo).getByRole("button", { name: "Concluir" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Batida leve na traseira")).toBeInTheDocument();
  });

  it("ao editar uma existente, salvar fecha o modal como antes", async () => {
    prepararServicos();
    const atualizar = vi.spyOn(ocorrenciasService, "atualizar").mockResolvedValue(ocorrencia);
    const criar = vi.spyOn(ocorrenciasService, "criar");
    const user = userEvent.setup();

    renderizar("gestor");
    await user.click(await screen.findByRole("button", { name: /Abrir ocorrência de/ }));
    const dialogo = screen.getByRole("dialog");
    expect(within(dialogo).getByRole("region", { name: "Fotos" })).toBeInTheDocument();
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(atualizar).toHaveBeenCalledWith(7, expect.objectContaining({ descricao: "Retrovisor quebrado" })));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(criar).not.toHaveBeenCalled();
    expect(screen.queryByText(/Ocorrência registrada/)).not.toBeInTheDocument();
  });

  it("aponta cada campo que falta, ligado a ele, e põe o foco no primeiro", async () => {
    prepararServicos();
    const criar = vi.spyOn(ocorrenciasService, "criar");
    const user = userEvent.setup();

    renderizar("motorista");
    await user.click(await screen.findByRole("button", { name: /Registrar ocorrência/ }));
    const dialogo = screen.getByRole("dialog");

    // Sem registro ainda, não há onde anexar foto.
    expect(within(dialogo).queryByRole("region", { name: "Fotos" })).not.toBeInTheDocument();

    const erroDe = (campo: HTMLElement) => {
      expect(campo).toHaveAttribute("aria-invalid", "true");
      return document.getElementById(campo.getAttribute("aria-describedby") as string)?.textContent;
    };

    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    const veiculo = within(dialogo).getByLabelText("Veículo");
    const data = within(dialogo).getByLabelText("Data e hora");
    const descricao = within(dialogo).getByLabelText("O que aconteceu");
    expect(erroDe(veiculo)).toBe("Escolha o veículo.");
    expect(erroDe(data)).toBe("Informe a data e a hora.");
    expect(erroDe(descricao)).toBe("Descreva o que aconteceu (pelo menos 3 caracteres).");
    expect(veiculo).toHaveFocus();

    // Corrigir um campo tira só o erro dele; o foco vai para o próximo que falta.
    await user.selectOptions(veiculo, "1");
    expect(veiculo).not.toHaveAttribute("aria-invalid");
    expect(veiculo).not.toHaveAttribute("aria-describedby");
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }));
    expect(data).toHaveFocus();
    expect(criar).not.toHaveBeenCalled();
  });

  it("os botões das fotos dizem o momento e têm alvo de 44px só no celular", async () => {
    vi.spyOn(ocorrenciasService, "listar").mockResolvedValue({
      dados: [{ ...ocorrencia, fotos: [{ id: 1, momento: "antes", url: "https://api.exemplo.com/f1" }, { id: 2, momento: "depois", url: "https://api.exemplo.com/f2" }] }],
      paginaAtual: 1,
      totalPaginas: 1,
      totalRegistros: 1,
      resumo,
    });
    vi.spyOn(contaService, "listarVeiculos").mockResolvedValue({ dados: [], paginaAtual: 1, totalPaginas: 1, totalRegistros: 0 } as never);
    const user = userEvent.setup();

    renderizar("gestor");
    await user.click(await screen.findByRole("button", { name: /Abrir ocorrência de/ }));
    const fotos = within(screen.getByRole("dialog")).getByRole("region", { name: "Fotos" });

    const alvos = [
      within(fotos).getByRole("link", { name: "Ver foto de antes" }),
      within(fotos).getByRole("link", { name: "Ver foto de depois" }),
      within(fotos).getByRole("button", { name: "Remover foto de antes" }),
      within(fotos).getByRole("button", { name: "Remover foto de depois" }),
      within(fotos).getByRole("button", { name: /Foto antes/ }),
      within(fotos).getByRole("button", { name: /Foto depois/ }),
    ];
    alvos.forEach((alvo) => expect(alvo).toHaveClass("h-11", "md:h-9"));
  });
});
