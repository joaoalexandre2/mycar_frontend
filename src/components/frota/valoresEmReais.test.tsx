import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { ocorrenciasService } from "../../services/ocorrencias";
import { despesasAvulsasService } from "../../services/financeiro";
import { multasService } from "../../services/frotaDiferenciais";
import { contaService } from "../../services/conta/veiculos";
import { motoristasService } from "../../services/frota";
import { Multas } from "../../pages/Frota/Multas";
import { OcorrenciaModal } from "./OcorrenciaModal";
import { DespesaAvulsaModal } from "./DespesaAvulsaModal";
import type { Ocorrencia } from "../../types/ocorrencias";
import type { DespesaAvulsa } from "../../types/financeiro";
import type { VeiculoConta } from "../../types/conta";

afterEach(() => vi.restoreAllMocks());

const veiculos = [{ id: 1, placa: "AAA1A11", marca: "Fiat", modelo: "Strada" }] as unknown as VeiculoConta[];

// Os textos que a pessoa digita ou cola e o número que precisa chegar à API.
const VALIDOS: [string, number | null][] = [
  ["1500,50", 1500.5],
  ["1.500,50", 1500.5],
  ["1500.50", 1500.5],
  ["2.500", 2500],
];

/** O erro do campo fica ligado a ele por aria-describedby, logo abaixo. */
function erroDoCampo(rotulo: string) {
  const campo = screen.getByLabelText(rotulo);
  const id = campo.getAttribute("aria-describedby");

  expect(campo).toHaveAttribute("aria-invalid", "true");
  expect(id).toBeTruthy();

  return document.getElementById(id as string)?.textContent;
}

describe("OcorrenciaModal: valores em reais", () => {
  function renderizar(ocorrencia: Ocorrencia | null = null) {
    const onSalva = vi.fn();

    render(
      <NotificacoesProvider>
        <OcorrenciaModal ocorrencia={ocorrencia} veiculos={veiculos} gerencia onSalva={onSalva} onClose={vi.fn()} />
      </NotificacoesProvider>,
    );

    return onSalva;
  }

  async function preencherObrigatorios(user: ReturnType<typeof userEvent.setup>) {
    await user.selectOptions(screen.getByLabelText("Veículo"), "1");
    fireEvent.change(screen.getByLabelText("Data e hora"), { target: { value: "2026-11-20T10:00" } });
    await user.type(screen.getByLabelText("O que aconteceu"), "Batida no estacionamento");
  }

  it.each([...VALIDOS, ["", null]] as [string, number | null][])("prejuízo %j é enviado como %s", async (texto, esperado) => {
    const user = userEvent.setup();
    const criar = vi.spyOn(ocorrenciasService, "criar").mockResolvedValue({} as never);
    renderizar();

    await preencherObrigatorios(user);
    if (texto) await user.type(screen.getByLabelText("Prejuízo estimado (R$)"), texto);
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(criar).toHaveBeenCalledTimes(1));
    expect(criar.mock.calls[0][0]).toMatchObject({ prejuizoEstimado: esperado, valorGasto: null });
  });

  it("mostra como o valor será gravado, para conferir o \"2.500\"", async () => {
    const user = userEvent.setup();
    renderizar();

    await user.type(screen.getByLabelText("Prejuízo estimado (R$)"), "2.500");

    expect(screen.getByText(/Será gravado R\$\s2\.500,00/)).toBeInTheDocument();
  });

  it("texto que não é número mostra o erro no campo e não envia", async () => {
    const user = userEvent.setup();
    const criar = vi.spyOn(ocorrenciasService, "criar").mockResolvedValue({} as never);
    renderizar();

    await preencherObrigatorios(user);
    await user.type(screen.getByLabelText("Valor gasto (R$)"), "abc");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(erroDoCampo("Valor gasto (R$)")).toBe("Use só números, como 1.500,50.");
    expect(screen.getByRole("alert")).toHaveTextContent("Corrija os valores destacados.");
    expect(criar).not.toHaveBeenCalled();

    // Ao corrigir, o erro do campo some.
    await user.clear(screen.getByLabelText("Valor gasto (R$)"));
    expect(screen.getByLabelText("Valor gasto (R$)")).not.toHaveAttribute("aria-invalid");
  });

  it("ao editar, o valor do servidor volta ao campo e é salvo sem mudar", async () => {
    const user = userEvent.setup();
    const atualizar = vi.spyOn(ocorrenciasService, "atualizar").mockResolvedValue({} as never);
    renderizar({
      id: 7,
      tipo: "avaria",
      tipoRotulo: "Avaria",
      status: "aberta",
      statusRotulo: "Aberta",
      dataHora: "2026-11-20T10:00:00-03:00",
      local: null,
      descricao: "Batida no estacionamento",
      veiculo: { id: 1, placa: "AAA1A11" },
      motorista: null,
      fotos: [],
      prejuizoEstimado: 1500.5,
      valorGasto: 2500,
      despesaId: null,
    });

    expect(screen.getByLabelText("Prejuízo estimado (R$)")).toHaveValue("1500,50");
    expect(screen.getByLabelText("Valor gasto (R$)")).toHaveValue("2500,00");

    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(atualizar).toHaveBeenCalledTimes(1));
    expect(atualizar.mock.calls[0][1]).toMatchObject({ prejuizoEstimado: 1500.5, valorGasto: 2500 });
  });
});

describe("Nova multa: valor em reais", () => {
  async function abrirEPreencher(user: ReturnType<typeof userEvent.setup>) {
    vi.spyOn(multasService, "listar").mockResolvedValue({ dados: [], paginaAtual: 1, totalPaginas: 0, totalRegistros: 0 });
    vi.spyOn(multasService, "sugerirResponsavel").mockResolvedValue({ motorista: null, uso: null } as never);
    vi.spyOn(contaService, "listarVeiculos").mockResolvedValue({ dados: veiculos, paginaAtual: 1, totalPaginas: 1, totalRegistros: 1 } as never);
    vi.spyOn(motoristasService, "listar").mockResolvedValue([] as never);

    render(
      <NotificacoesProvider>
        <Multas />
      </NotificacoesProvider>,
    );

    await user.click(await screen.findByRole("button", { name: /Nova multa/ }));
    await screen.findByRole("option", { name: /AAA1A11/ });
    await user.selectOptions(screen.getByLabelText("Veículo"), "1");
    fireEvent.change(screen.getByLabelText("Data e hora da infração"), { target: { value: "2026-11-20T10:00" } });
    await user.type(screen.getByLabelText("Infração"), "Excesso de velocidade");
  }

  it.each([...VALIDOS, ["", null]] as [string, number | null][])("valor %j é enviado como %s", async (texto, esperado) => {
    const user = userEvent.setup();
    const criar = vi.spyOn(multasService, "criar").mockResolvedValue({} as never);

    await abrirEPreencher(user);
    if (texto) await user.type(screen.getByLabelText("Valor (R$)"), texto);
    await user.click(screen.getByRole("button", { name: "Registrar multa" }));

    await waitFor(() => expect(criar).toHaveBeenCalledTimes(1));
    expect(criar.mock.calls[0][0]).toMatchObject({ valor: esperado });
  });

  it("texto que não é número mostra o erro no campo em vez de gravar a multa sem valor", async () => {
    const user = userEvent.setup();
    const criar = vi.spyOn(multasService, "criar").mockResolvedValue({} as never);

    await abrirEPreencher(user);
    await user.type(screen.getByLabelText("Valor (R$)"), "abc");
    await user.click(screen.getByRole("button", { name: "Registrar multa" }));

    expect(erroDoCampo("Valor (R$)")).toBe("Use só números, como 1.500,50.");
    expect(criar).not.toHaveBeenCalled();
  });
});

describe("DespesaAvulsaModal: valor em reais", () => {
  function renderizar(despesa: DespesaAvulsa | null = null) {
    render(
      <DespesaAvulsaModal
        despesa={despesa}
        categorias={[{ id: 2, nome: "Pedágio", ativo: true }]}
        veiculos={[]}
        motoristas={[]}
        centros={[]}
        onSalva={vi.fn()}
        onClose={vi.fn()}
      />,
    );
  }

  it.each(VALIDOS)("valor %j é enviado como %s", async (texto, esperado) => {
    const user = userEvent.setup();
    const criar = vi.spyOn(despesasAvulsasService, "criar").mockResolvedValue({} as never);
    renderizar();

    await user.selectOptions(screen.getByLabelText("Categoria"), "2");
    await user.type(screen.getByLabelText("Valor (R$)"), texto);
    await user.click(screen.getByRole("button", { name: /Salvar|Registrar/ }));

    await waitFor(() => expect(criar).toHaveBeenCalledTimes(1));
    expect(criar.mock.calls[0][0]).toMatchObject({ valor: esperado });
  });

  it.each([
    ["abc", "Use só números, como 1.500,50."],
    ["", "Informe um valor maior que zero."],
    ["0", "Informe um valor maior que zero."],
  ])("valor %j mostra o erro no campo e não envia", async (texto, mensagem) => {
    const user = userEvent.setup();
    const criar = vi.spyOn(despesasAvulsasService, "criar").mockResolvedValue({} as never);
    renderizar();

    await user.selectOptions(screen.getByLabelText("Categoria"), "2");
    if (texto) await user.type(screen.getByLabelText("Valor (R$)"), texto);
    await user.click(screen.getByRole("button", { name: /Salvar|Registrar/ }));

    expect(erroDoCampo("Valor (R$)")).toBe(mensagem);
    expect(criar).not.toHaveBeenCalled();
  });

  it("ao editar, o valor do servidor volta ao campo e é salvo sem mudar", async () => {
    const user = userEvent.setup();
    const atualizar = vi.spyOn(despesasAvulsasService, "atualizar").mockResolvedValue({} as never);
    renderizar({
      id: 9,
      data: "2026-11-20",
      valor: 1500.5,
      descricao: null,
      comprovante: null,
      categoria: { id: 2, nome: "Pedágio" },
      veiculo: null,
      motorista: null,
      centroCusto: null,
    });

    expect(screen.getByLabelText("Valor (R$)")).toHaveValue("1500,50");

    await user.click(screen.getByRole("button", { name: /Salvar|Registrar/ }));

    await waitFor(() => expect(atualizar).toHaveBeenCalledTimes(1));
    expect(atualizar.mock.calls[0][1]).toMatchObject({ valor: 1500.5 });
  });
});
