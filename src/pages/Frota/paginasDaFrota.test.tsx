import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { contaService } from "../../services/conta";
import { centrosCustoService, motoristasService, usosService } from "../../services/frota";
import { UsoFormModal } from "../../components/frota/UsoFormModal";
import { Agenda } from "./Agenda";
import { Cadastros } from "./Cadastros";
import { mesVizinho, paraCampoDeHorario, periodoDaGrade } from "../../utils/agenda";
import type { VeiculoConta } from "../../types/conta";
import type { CentroCusto, Motorista, UsoVeiculo } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const hoje = paraCampoDeHorario(new Date()).slice(0, 10);

function veiculo(id: number, placa: string, extra: Partial<VeiculoConta> = {}): VeiculoConta {
  return {
    id,
    apelido: null,
    placa,
    marca: "Fiat",
    modelo: "Strada",
    ano: 2022,
    anoFabricacao: null,
    anoCompleto: "2022",
    isentoIpva: false,
    possivelIsencaoIpva: false,
    fotoCapaUrl: null,
    uf: "SP",
    ipvaEstimado: null,
    licenciamentoValor: null,
    proximoVencimentoIpva: null,
    proximoVencimentoLicenciamento: null,
    revisaoPrevistaEm: null,
    fipeMarcaId: null,
    fipeModeloId: null,
    fipeAno: null,
    fipeValor: null,
    fipeConsultadoEm: null,
    kmAtual: null,
    kmAtualizadoEm: null,
    centroCustoId: null,
    ...extra,
  };
}

const maria: Motorista = { id: 2, nome: "Maria Silva", telefone: "11 99999-0000", cnhNumero: "123", cnhValidade: "2030-01-01", ativo: true };
const entregas: CentroCusto = { id: 5, nome: "Entregas", codigo: "CC-01", ativo: true };

function uso(parcial: Partial<UsoVeiculo> = {}): UsoVeiculo {
  return {
    id: 7,
    veiculoId: 1,
    veiculo: { id: 1, nome: "Strada", placa: "AAA1B25", kmAtual: null },
    motoristaId: 2,
    motorista: "Maria Silva",
    centroCustoId: 5,
    centroCusto: "Entregas",
    inicioPrevisto: `${hoje}T09:00`,
    fimPrevisto: `${hoje}T11:00`,
    finalidade: "Visita a clientes",
    status: "agendado",
    kmSaida: null,
    kmChegada: null,
    kmRodados: null,
    saidaEm: null,
    chegadaEm: null,
    urlFotoSaida: null,
    urlFotoChegada: null,
    origem: "agenda",
    observacoes: null,
    ...parcial,
  };
}

function simularAgenda(opcoes: { veiculos?: VeiculoConta[]; usos?: UsoVeiculo[] } = {}) {
  return {
    veiculos: vi.spyOn(contaService, "listarTodosVeiculos").mockResolvedValue(opcoes.veiculos ?? [veiculo(1, "AAA1B25"), veiculo(2, "BBB2C36")]),
    motoristas: vi.spyOn(motoristasService, "listar").mockResolvedValue([maria]),
    centros: vi.spyOn(centrosCustoService, "listar").mockResolvedValue([entregas]),
    usos: vi.spyOn(usosService, "listar").mockResolvedValue(opcoes.usos ?? [uso()]),
  };
}

function agenda() {
  return render(
    <NotificacoesProvider>
      <MemoryRouter>
        <Agenda />
      </MemoryRouter>
    </NotificacoesProvider>,
  );
}

describe("Agenda", () => {
  it("mostra o uso no dia dele, com hora, placa e motorista", async () => {
    simularAgenda();
    agenda();

    expect(await screen.findByRole("button", { name: /09:00 · AAA1B25 · Maria Silva/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /\d{4}/ })).toBeInTheDocument();
  });

  it("clicar no uso abre o detalhe com as ações da saída", async () => {
    simularAgenda();
    agenda();

    await userEvent.click(await screen.findByRole("button", { name: /09:00 · AAA1B25 · Maria Silva/ }));

    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByText("AAA1B25 · Strada")).toBeInTheDocument();
    expect(within(dialogo).getByRole("button", { name: "Registrar saída" })).toBeInTheDocument();
  });

  it("pede ao servidor o período da grade do mês e refaz o pedido ao trocar de mês", async () => {
    const { usos } = simularAgenda();
    agenda();

    await screen.findByRole("button", { name: /^09:00 · AAA1B25/ });

    const [ano, mes] = [Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7))];
    expect(usos).toHaveBeenLastCalledWith({ ...periodoDaGrade(ano, mes), veiculoId: undefined, motoristaId: undefined });

    await userEvent.click(screen.getByRole("button", { name: "Próximo mês" }));

    const seguinte = mesVizinho(ano, mes, 1);
    await waitFor(() =>
      expect(usos).toHaveBeenLastCalledWith({ ...periodoDaGrade(seguinte.ano, seguinte.mes), veiculoId: undefined, motoristaId: undefined }),
    );
  });

  it("filtra por veículo e por motorista", async () => {
    const { usos } = simularAgenda();
    agenda();

    await screen.findByRole("button", { name: /^09:00 · AAA1B25/ });
    await waitFor(() => expect(screen.getByRole("option", { name: "BBB2C36" })).toBeInTheDocument());

    await userEvent.selectOptions(screen.getByLabelText("Filtrar por veículo"), "2");
    await waitFor(() => expect(usos).toHaveBeenLastCalledWith(expect.objectContaining({ veiculoId: 2 })));

    await userEvent.selectOptions(screen.getByLabelText("Filtrar por motorista"), "2");
    await waitFor(() => expect(usos).toHaveBeenLastCalledWith(expect.objectContaining({ veiculoId: 2, motoristaId: 2 })));
  });

  it("uso cancelado não aparece no calendário", async () => {
    simularAgenda({ usos: [uso({ status: "cancelado" })] });
    agenda();

    expect(await screen.findByText(/Nenhum uso agendado neste período/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /09:00/ })).not.toBeInTheDocument();
  });

  it("sem veículos, avisa e não deixa reservar", async () => {
    simularAgenda({ veiculos: [], usos: [] });
    agenda();

    expect(await screen.findByText(/Cadastre os veículos da frota/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reservar veículo/ })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Veículos da frota" })).toHaveAttribute("href", "/veiculos");
  });

  it("mostra o erro quando o servidor não responde", async () => {
    simularAgenda();
    vi.spyOn(usosService, "listar").mockRejectedValue(
      Object.assign(new Error("500"), {
        isAxiosError: true,
        response: { status: 500, data: { message: "Servidor fora do ar" } },
      }),
    );
    agenda();

    expect(await screen.findByRole("alert")).toHaveTextContent("Servidor fora do ar");
  });

  it("clicar no número do dia abre a reserva já nesse dia", async () => {
    simularAgenda({ usos: [] });
    agenda();

    await screen.findByText(/Nenhum uso agendado/);
    await waitFor(() => expect(screen.getByRole("button", { name: /Reservar veículo/ })).toBeEnabled());

    const dia = Number(hoje.slice(8, 10));
    const celula = screen.getAllByRole("gridcell").find((c) => within(c).queryByTitle("Reservar neste dia")?.textContent === String(dia) && c.className.includes("bg-white"))!;
    await userEvent.click(within(celula).getByTitle("Reservar neste dia"));

    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByLabelText("Início")).toHaveValue(`${hoje}T08:00`);
  });
});

// ------------------------------------------------------------------ UsoFormModal

function formulario(extra: Partial<React.ComponentProps<typeof UsoFormModal>> = {}) {
  const props = {
    veiculos: [veiculo(1, "AAA1B25", { centroCustoId: 5 }), veiculo(2, "BBB2C36")],
    motoristas: [maria],
    centros: [entregas, { id: 6, nome: "Vendas", codigo: null, ativo: true }],
    onSalvo: vi.fn(),
    onClose: vi.fn(),
    ...extra,
  };

  render(<UsoFormModal {...props} />);

  return props;
}

describe("UsoFormModal", () => {
  it("sugere o centro de custo padrão do veículo escolhido", async () => {
    formulario({ diaInicial: "2026-11-10" });

    await userEvent.selectOptions(screen.getByLabelText("Veículo"), "1");

    expect(screen.getByLabelText("Centro de custo")).toHaveValue("5");
    expect(screen.getByLabelText("Início")).toHaveValue("2026-11-10T08:00");
    expect(screen.getByLabelText("Fim previsto")).toHaveValue("2026-11-10T18:00");
  });

  it("mudar o dia do início leva o fim junto, já pré-preenchido", () => {
    formulario({ diaInicial: "2026-10-26" });

    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-10-28T08:00" } });

    expect(screen.getByLabelText("Início")).toHaveValue("2026-10-28T08:00");
    expect(screen.getByLabelText("Fim previsto")).toHaveValue("2026-10-28T18:00");
  });

  it("o fim não aceita data antes do início (limite mínimo no campo)", () => {
    formulario({ diaInicial: "2026-10-26" });

    expect(screen.getByLabelText("Fim previsto")).toHaveAttribute("min", "2026-10-26T08:00");

    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-10-30T09:00" } });

    expect(screen.getByLabelText("Fim previsto")).toHaveAttribute("min", "2026-10-30T09:00");
  });

  it("sem início ou sem fim, avisa e não chama o servidor", async () => {
    const criar = vi.spyOn(usosService, "criar");
    formulario({ diaInicial: "2026-10-26" });

    await userEvent.selectOptions(screen.getByLabelText("Veículo"), "1");
    fireEvent.change(screen.getByLabelText("Fim previsto"), { target: { value: "" } });
    await userEvent.click(screen.getByRole("button", { name: "Reservar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe o início e o fim da reserva");
    expect(criar).not.toHaveBeenCalled();
  });

  it("início depois do fim no mesmo dia empurra o fim para frente", () => {
    formulario({ diaInicial: "2026-10-26" });

    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-10-26T19:30" } });

    expect(screen.getByLabelText("Fim previsto")).toHaveValue("2026-10-26T20:30");
  });

  it("não troca um centro que a pessoa já escolheu", async () => {
    formulario();

    await userEvent.selectOptions(screen.getByLabelText("Centro de custo"), "6");
    await userEvent.selectOptions(screen.getByLabelText("Veículo"), "1");

    expect(screen.getByLabelText("Centro de custo")).toHaveValue("6");
  });

  it("cria a reserva com o que foi preenchido", async () => {
    const criar = vi.spyOn(usosService, "criar").mockResolvedValue(uso());
    const props = formulario({ diaInicial: "2026-11-10" });

    await userEvent.selectOptions(screen.getByLabelText("Veículo"), "2");
    await userEvent.selectOptions(screen.getByLabelText("Motorista"), "2");
    await userEvent.type(screen.getByLabelText("Finalidade"), "Entrega em Campinas");
    await userEvent.click(screen.getByRole("button", { name: "Reservar" }));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith({
        veiculo_conta_id: 2,
        motorista_id: 2,
        centro_custo_id: null,
        inicio_previsto: "2026-11-10T08:00",
        fim_previsto: "2026-11-10T18:00",
        finalidade: "Entrega em Campinas",
        observacoes: null,
      }),
    );
    expect(props.onSalvo).toHaveBeenCalled();
  });

  it("exige o veículo e um fim depois do início, sem chamar o servidor", async () => {
    const criar = vi.spyOn(usosService, "criar");
    formulario({ diaInicial: "2026-11-10" });

    await userEvent.click(screen.getByRole("button", { name: "Reservar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Escolha o veículo");

    await userEvent.selectOptions(screen.getByLabelText("Veículo"), "1");
    const fim = screen.getByLabelText("Fim previsto");
    await userEvent.clear(fim);
    await userEvent.type(fim, "2026-11-10T07:00");
    await userEvent.click(screen.getByRole("button", { name: "Reservar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("O fim da reserva precisa ser depois do início");
    expect(criar).not.toHaveBeenCalled();
  });

  it("mostra o conflito de horário que o servidor devolveu", async () => {
    vi.spyOn(usosService, "criar").mockRejectedValue(
      Object.assign(new Error("422"), {
        isAxiosError: true,
        response: { status: 422, data: { message: "O veículo já está reservado nesse horário (10/11 08:00 a 10/11 12:00)." } },
      }),
    );
    const props = formulario({ diaInicial: "2026-11-10" });

    await userEvent.selectOptions(screen.getByLabelText("Veículo"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Reservar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("O veículo já está reservado nesse horário");
    expect(props.onSalvo).not.toHaveBeenCalled();
  });

  it("em uso, o veículo e o início ficam travados", () => {
    formulario({ uso: uso({ status: "em_uso", kmSaida: 100 }) });

    expect(screen.getByLabelText("Veículo")).toBeDisabled();
    expect(screen.getByLabelText("Início")).toBeDisabled();
    expect(screen.getByLabelText("Fim previsto")).toBeEnabled();
  });
});

// ---------------------------------------------------------------------- Cadastros

function cadastros() {
  return render(
    <NotificacoesProvider>
      <Cadastros />
    </NotificacoesProvider>,
  );
}

describe("Cadastros: motoristas", () => {
  it("lista os motoristas e destaca a CNH vencida e a que vence em breve", async () => {
    const emBreve = new Date();
    emBreve.setDate(emBreve.getDate() + 10);
    vi.spyOn(motoristasService, "listar").mockResolvedValue([
      { ...maria, id: 1, nome: "Ana Vencida", cnhValidade: "2020-01-01" },
      { ...maria, id: 2, nome: "Beto Quase", cnhValidade: paraCampoDeHorario(emBreve).slice(0, 10) },
      { ...maria, id: 3, nome: "Caio Em Dia", cnhValidade: "2099-01-01" },
    ]);
    cadastros();

    expect(await screen.findByText("Ana Vencida")).toBeInTheDocument();
    expect(screen.getAllByText("CNH vencida")).toHaveLength(1);
    expect(screen.getAllByText("CNH vence em breve")).toHaveLength(1);
  });

  it("cadastra um motorista e recarrega a lista", async () => {
    const listar = vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([entregas]);
    const criar = vi.spyOn(motoristasService, "criar").mockResolvedValue(maria);
    cadastros();

    expect(await screen.findByText("Nenhum motorista cadastrado ainda.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Novo motorista/ }));
    await userEvent.type(await screen.findByLabelText("Nome"), "  Maria Silva  ");
    await userEvent.type(screen.getByLabelText("Telefone"), "11 99999-0000");
    await screen.findByRole("option", { name: "Entregas" });
    await userEvent.selectOptions(screen.getByLabelText("Centro de custo"), String(entregas.id));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith({
        nome: "Maria Silva",
        telefone: "11 99999-0000",
        cnh_numero: null,
        cnh_validade: null,
        centro_custo_id: entregas.id,
      }),
    );
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
  });

  it("não envia motorista sem nome", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    const criar = vi.spyOn(motoristasService, "criar");
    cadastros();

    await userEvent.click(await screen.findByRole("button", { name: /Novo motorista/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe o nome do motorista");
    expect(criar).not.toHaveBeenCalled();
  });

  it("desativa em vez de apagar e mostra a recusa de quem tem histórico", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([maria]);
    const atualizar = vi.spyOn(motoristasService, "atualizar").mockResolvedValue({ ...maria, ativo: false });
    vi.spyOn(motoristasService, "remover").mockRejectedValue(
      Object.assign(new Error("422"), {
        isAxiosError: true,
        response: { status: 422, data: { message: "Este motorista tem usos de veículo no histórico. Desative-o em vez de apagar." } },
      }),
    );
    cadastros();

    await userEvent.click(await screen.findByRole("button", { name: "Desativar" }));
    await waitFor(() => expect(atualizar).toHaveBeenCalledWith(2, { nome: "Maria Silva", ativo: false }));

    await userEvent.click(screen.getByRole("button", { name: "Remover Maria Silva" }));
    await userEvent.click(await screen.findByRole("button", { name: "Remover" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Desative-o em vez de apagar");
  });
});

describe("Cadastros: centros de custo", () => {
  it("cadastra um centro com código e lista os existentes", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    const listar = vi.spyOn(centrosCustoService, "listar").mockResolvedValue([entregas]);
    const criar = vi.spyOn(centrosCustoService, "criar").mockResolvedValue(entregas);
    cadastros();

    await userEvent.click(screen.getByRole("tab", { name: /Centros de custo/ }));

    expect(await screen.findByText("Entregas")).toBeInTheDocument();
    expect(screen.getByText("Código CC-01")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Novo centro de custo/ }));
    await userEvent.type(await screen.findByLabelText("Nome"), "Vendas");
    await userEvent.type(screen.getByLabelText("Código (opcional)"), "CC-02");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(criar).toHaveBeenCalledWith({ nome: "Vendas", codigo: "CC-02" }));
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
  });

  it("mostra o aviso do servidor quando o centro tem histórico e não pode ser apagado", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([entregas]);
    vi.spyOn(centrosCustoService, "remover").mockRejectedValue(
      Object.assign(new Error("422"), {
        isAxiosError: true,
        response: { status: 422, data: { message: "Este centro de custo tem veículos ou usos ligados a ele. Desative-o em vez de apagar." } },
      }),
    );
    cadastros();

    await userEvent.click(screen.getByRole("tab", { name: /Centros de custo/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Remover Entregas" }));
    await userEvent.click(await screen.findByRole("button", { name: "Remover" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Desative-o em vez de apagar");
  });
});
