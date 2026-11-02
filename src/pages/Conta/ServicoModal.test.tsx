import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { servicoService } from "../../services/conta";
import type { Servico, ServicosDaConta, VeiculoConta } from "../../types/conta";
import { ServicoModal } from "./ServicoModal";

afterEach(() => vi.restoreAllMocks());

const tipos = [
  { tipo: "oleo", rotulo: "Troca de óleo" },
  { tipo: "filtros", rotulo: "Filtros" },
  { tipo: "outro", rotulo: "Outro" },
];

const veiculo = { id: 7, placa: "AAA1B25", marca: "Fiat", modelo: "Uno", apelido: null } as unknown as VeiculoConta;

const resposta: ServicosDaConta = { tipos, servicos: [] };

function servicoExistente(extra: Partial<Servico> = {}): Servico {
  return {
    id: 1,
    veiculoContaId: 7,
    veiculo: "Uno",
    placa: "AAA1B25",
    tipo: "oleo",
    rotulo: "Troca de óleo",
    titulo: null,
    realizadoEm: "2026-03-01",
    km: 50000,
    valor: 250,
    observacoes: null,
    intervaloMeses: 6,
    intervaloKm: 10000,
    proximoEm: "2026-09-01",
    proximaKm: 60000,
    vigente: true,
    kmAtual: 50000,
    diasRestantes: 180,
    kmRestante: 10000,
    situacao: "em_dia",
    natureza: "preventiva",
    oficina: "Oficina do Zé",
    valorPecas: 150,
    valorMaoDeObra: 100,
    pecas: [{ descricao: "Filtro de óleo", quantidade: 1, valorUnitario: 150 }],
    anexos: [{ id: 3, nome: "nota.pdf", url: "/api/servicos/anexos/3?signature=x" }],
    ...extra,
  };
}

function renderizar(servico: Servico | null = null) {
  const onSalvo = vi.fn();
  const onAnexosMudaram = vi.fn();

  render(
    <NotificacoesProvider>
      <ServicoModal
        servico={servico}
        veiculoInicial={veiculo}
        tipos={tipos}
        onClose={vi.fn()}
        onSalvo={onSalvo}
        onAnexosMudaram={onAnexosMudaram}
      />
    </NotificacoesProvider>,
  );

  return { onSalvo, onAnexosMudaram };
}

describe("ServicoModal: peças e mão de obra", () => {
  it("o total é a soma das peças e da mão de obra, e é isso que vai no envio", async () => {
    const registrar = vi.spyOn(servicoService, "registrar").mockResolvedValue(resposta);
    const { onSalvo } = renderizar();

    await userEvent.click(screen.getByRole("button", { name: /adicionar peça/i }));
    await userEvent.type(screen.getByLabelText("Peça"), "Filtro de ar");
    await userEvent.type(screen.getByLabelText("Preço unit. (R$)"), "45,5");

    await userEvent.click(screen.getByRole("button", { name: /adicionar peça/i }));
    await userEvent.type(screen.getAllByLabelText("Peça")[1], "Pastilha de freio");
    const quantidades = screen.getAllByLabelText("Qtd.");
    await userEvent.clear(quantidades[1]);
    await userEvent.type(quantidades[1], "2");
    await userEvent.type(screen.getAllByLabelText("Preço unit. (R$)")[1], "60");

    await userEvent.type(screen.getByLabelText("Mão de obra (R$)"), "80");
    await userEvent.type(screen.getByLabelText("Km do veículo"), "52300");

    expect(screen.getByText(/245,50/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Valor pago (R$)")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

    await waitFor(() => expect(onSalvo).toHaveBeenCalledWith(resposta));
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        veiculo_conta_id: 7,
        tipo: "oleo",
        km: 52300,
        valor: 245.5,
        valor_mao_obra: 80,
        intervalo_meses: 6,
        intervalo_km: 10000,
        pecas: [
          { descricao: "Filtro de ar", quantidade: 1, valor_unitario: 45.5 },
          { descricao: "Pastilha de freio", quantidade: 2, valor_unitario: 60 },
        ],
      }),
    );
  });

  it("sem peças nem mão de obra, o valor digitado é o total", async () => {
    const registrar = vi.spyOn(servicoService, "registrar").mockResolvedValue(resposta);
    const { onSalvo } = renderizar();

    await userEvent.type(screen.getByLabelText("Valor pago (R$)"), "120");
    await userEvent.type(screen.getByLabelText("Km do veículo"), "52300");
    await userEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

    await waitFor(() => expect(onSalvo).toHaveBeenCalledWith(resposta));
    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ valor: 120, valor_mao_obra: null, pecas: [] }));
  });

  it("recusa peça sem nome em vez de gravar", async () => {
    const registrar = vi.spyOn(servicoService, "registrar");
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: /adicionar peça/i }));
    await userEvent.type(screen.getByLabelText("Preço unit. (R$)"), "10");
    await userEvent.type(screen.getByLabelText("Km do veículo"), "52300");
    await userEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Informe o nome de cada peça ou remova a linha em branco.",
    );
    expect(registrar).not.toHaveBeenCalled();
  });
});

describe("ServicoModal: edição", () => {
  it("vem preenchida com as peças e grava pelo atualizar, sem trocar o veículo", async () => {
    const atualizar = vi.spyOn(servicoService, "atualizar").mockResolvedValue(resposta);
    const { onSalvo } = renderizar(servicoExistente());

    expect(screen.getByDisplayValue("Filtro de óleo")).toBeInTheDocument();
    expect(screen.getByLabelText("Oficina (opcional)")).toHaveValue("Oficina do Zé");
    expect(screen.getByLabelText(/preventiva ou corretiva/i)).toHaveValue("preventiva");
    expect(screen.getByText(/250,00/)).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Oficina (opcional)"));
    await userEvent.type(screen.getByLabelText("Oficina (opcional)"), "Oficina Nova");
    await userEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

    await waitFor(() => expect(onSalvo).toHaveBeenCalledWith(resposta));
    expect(atualizar).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        oficina: "Oficina Nova",
        valor: 250,
        valor_mao_obra: 100,
        pecas: [{ descricao: "Filtro de óleo", quantidade: 1, valor_unitario: 150 }],
      }),
    );
  });

  it("anexa uma nota fiscal e avisa a tela para recarregar a lista", async () => {
    const anexar = vi.spyOn(servicoService, "anexar").mockResolvedValue({
      id: 4,
      nome: "recibo.pdf",
      url: "/api/servicos/anexos/4?signature=z",
    });
    const { onAnexosMudaram } = renderizar(servicoExistente());

    expect(screen.getByRole("link", { name: "nota.pdf" })).toHaveAttribute(
      "href",
      "/api/servicos/anexos/3?signature=x",
    );

    await userEvent.upload(
      screen.getByLabelText("Anexar nota fiscal ou recibo"),
      new File(["%PDF"], "recibo.pdf", { type: "application/pdf" }),
    );

    await waitFor(() => expect(onAnexosMudaram).toHaveBeenCalledTimes(1));
    expect(anexar).toHaveBeenCalledWith(1, expect.any(File));
    expect(screen.getByRole("link", { name: "recibo.pdf" })).toBeInTheDocument();
  });

  it("remover uma nota fiscal pede confirmação antes", async () => {
    const removerAnexo = vi.spyOn(servicoService, "removerAnexo").mockResolvedValue(undefined);
    const { onAnexosMudaram } = renderizar(servicoExistente());

    await userEvent.click(screen.getByRole("button", { name: "Remover nota.pdf" }));
    const dialogo = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Remover" }));

    await waitFor(() => expect(removerAnexo).toHaveBeenCalledWith(3));
    expect(onAnexosMudaram).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("link", { name: "nota.pdf" })).not.toBeInTheDocument();
  });
});
