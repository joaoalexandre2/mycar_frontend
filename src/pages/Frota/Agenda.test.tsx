import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { contaService } from "../../services/conta";
import { centrosCustoService, motoristasService, usosService } from "../../services/frota";
import { Agenda } from "./Agenda";
import { paraCampoDeHorario } from "../../utils/agenda";
import type { VeiculoConta } from "../../types/conta";
import type { UsoVeiculo } from "../../types/frota";
import type { Usuario } from "../../types/auth";

afterEach(() => vi.restoreAllMocks());

const hoje = paraCampoDeHorario(new Date()).slice(0, 10);
/** Um dia que existe em todo mês, para os testes da lista do celular. */
const dia15 = `${hoje.slice(0, 8)}15`;
const dataCompleta = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}/${dia.slice(0, 4)}`;

function veiculo(id: number, placa: string): VeiculoConta {
  return {
    id, apelido: null, placa, marca: "Fiat", modelo: "Strada", ano: 2022, anoFabricacao: null, anoCompleto: "2022",
    isentoIpva: false, possivelIsencaoIpva: false, fotoCapaUrl: null, uf: "SP", ipvaEstimado: null,
    licenciamentoValor: null, proximoVencimentoIpva: null, proximoVencimentoLicenciamento: null,
    revisaoPrevistaEm: null, fipeMarcaId: null, fipeModeloId: null, fipeAno: null, fipeValor: null,
    fipeConsultadoEm: null, kmAtual: null, kmAtualizadoEm: null, centroCustoId: null,
  };
}

function uso(parcial: Partial<UsoVeiculo> = {}): UsoVeiculo {
  return {
    id: 7, veiculoId: 1, veiculo: { id: 1, nome: "Strada", placa: "AAA1B25", kmAtual: null },
    motoristaId: 2, motorista: "Maria Silva", centroCustoId: 5, centroCusto: "Entregas",
    inicioPrevisto: `${hoje}T09:00`, fimPrevisto: `${hoje}T11:00`, finalidade: null, status: "agendado",
    kmSaida: null, kmChegada: null, kmRodados: null, saidaEm: null, chegadaEm: null,
    urlFotoSaida: null, urlFotoChegada: null, origem: "agenda", observacoes: null,
    ...parcial,
  };
}

function simular(usos: UsoVeiculo[] = [uso()]) {
  vi.spyOn(contaService, "listarTodosVeiculos").mockResolvedValue([veiculo(1, "AAA1B25")]);
  vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
  vi.spyOn(centrosCustoService, "listar").mockResolvedValue([]);

  return vi.spyOn(usosService, "listar").mockResolvedValue(usos);
}

function agenda(usuario: Usuario | null = null) {
  const auth: AuthContextValor = { usuario, autenticado: true, entrar: async () => {}, sair: async () => {}, atualizarUsuario: () => {} };

  return render(
    <AuthContext.Provider value={auth}>
      <NotificacoesProvider>
        <MemoryRouter>
          <Agenda />
        </MemoryRouter>
      </NotificacoesProvider>
    </AuthContext.Provider>,
  );
}

/** O cartão do dia na lista do celular (o título é "15/11", às vezes com "hoje"). */
const cartaoDoDia = (dia: string) => screen.getByRole("region", { name: new RegExp(`^${dia.slice(8, 10)}/${dia.slice(5, 7)}`) });

describe("Agenda: status por escrito", () => {
  it("o chip do calendário escreve o status e diz tudo ao leitor de tela", async () => {
    simular([uso(), uso({ id: 8, status: "em_uso", inicioPrevisto: `${hoje}T13:00`, fimPrevisto: `${hoje}T15:00` })]);
    agenda();

    const chip = await screen.findByRole("button", { name: /^09:00 · AAA1B25 · Maria Silva · Agendado · / });
    expect(chip).toHaveTextContent("Agendado");
    expect(chip).toHaveAccessibleName(`09:00 · AAA1B25 · Maria Silva · Agendado · ${hoje.slice(8, 10)}/${hoje.slice(5, 7)} 09:00 – 11:00`);
    // "Agendado" sai da escala da marca (blue), que é a mesma cor dos botões e do erro.
    expect(chip.className).toContain("bg-sky-50");
    expect(chip.className).not.toMatch(/\bbg-blue-/);

    expect(screen.getByRole("button", { name: /^13:00 · AAA1B25 · Maria Silva · Em uso/ })).toHaveTextContent("Em uso");
  });
});

describe("Agenda: +N mais", () => {
  it("abre a lista completa do dia, inclusive do quinto uso em diante", async () => {
    const placas = ["AAA1A11", "BBB2B22", "CCC3C33", "DDD4D44", "EEE5E55"];
    simular(
      placas.map((placa, i) =>
        uso({ id: i + 1, veiculo: { id: i + 1, nome: "Strada", placa, kmAtual: null }, inicioPrevisto: `${hoje}T0${i + 1}:00`, fimPrevisto: `${hoje}T0${i + 1}:30` }),
      ),
    );
    agenda();

    await userEvent.click(await screen.findByRole("button", { name: `+2 mais: ver os 5 usos de ${dataCompleta(hoje)}` }));

    const lista = await screen.findByRole("dialog", { name: `Usos de ${dataCompleta(hoje)}` });
    for (const placa of placas) {
      expect(within(lista).getByRole("button", { name: new RegExp(placa) })).toBeInTheDocument();
    }

    // O quinto, que antes ficava inalcançável, abre o detalhe.
    await userEvent.click(within(lista).getByRole("button", { name: /EEE5E55/ }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: `Usos de ${dataCompleta(hoje)}` })).not.toBeInTheDocument());
    expect(within(screen.getByRole("dialog")).getByText("EEE5E55 · Strada")).toBeInTheDocument();
  });

  it("da lista do dia dá para reservar nesse dia", async () => {
    simular([1, 2, 3, 4].map((id) => uso({ id })));
    agenda();

    await userEvent.click(await screen.findByRole("button", { name: /^\+1 mais/ }));
    await waitFor(() => expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Reservar neste dia" })).toBeEnabled());
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reservar neste dia" }));

    expect(await screen.findByLabelText("Início")).toHaveValue(`${hoje}T08:00`);
  });
});

describe("Agenda no celular: reservar num dia", () => {
  it("cada dia da lista tem 'Reservar neste dia' com 44px, que abre a reserva já nessa data", async () => {
    simular([uso({ inicioPrevisto: `${dia15}T09:00`, fimPrevisto: `${dia15}T11:00` })]);
    agenda();

    await screen.findByRole("button", { name: /^09:00 · AAA1B25/ });
    const botao = within(cartaoDoDia(dia15)).getByRole("button", { name: "Reservar neste dia" });
    expect(botao).toHaveClass("h-11");
    expect(botao).toHaveAccessibleDescription(new RegExp(`^${dia15.slice(8, 10)}/${dia15.slice(5, 7)}`));

    await waitFor(() => expect(botao).toBeEnabled());
    await userEvent.click(botao);

    expect(await screen.findByLabelText("Início")).toHaveValue(`${dia15}T08:00`);
    expect(screen.getByLabelText("Fim previsto")).toHaveValue(`${dia15}T18:00`);
  });

  it("o seletor de dia deixa reservar num dia livre (que não aparece na lista)", async () => {
    simular([]);
    agenda();

    const livre = `${hoje.slice(0, 8)}20`;
    const campo = await screen.findByLabelText("Reservar em outro dia");
    expect(campo).toHaveValue(hoje);
    expect(campo).toHaveClass("h-11");

    fireEvent.change(campo, { target: { value: livre } });
    const reservar = screen.getByRole("button", { name: "Reservar no dia escolhido" });
    expect(reservar).toHaveClass("h-11");
    await waitFor(() => expect(reservar).toBeEnabled());
    await userEvent.click(reservar);

    expect(await screen.findByLabelText("Início")).toHaveValue(`${livre}T08:00`);
  });
});

describe("Agenda: erro e vazio", () => {
  it("o erro de carga tem 'Tentar de novo', que pede de novo ao servidor", async () => {
    const listar = simular();
    listar.mockRejectedValueOnce(
      Object.assign(new Error("500"), { isAxiosError: true, response: { status: 500, data: { message: "Servidor fora do ar" } } }),
    );
    agenda();

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Servidor fora do ar");

    await userEvent.click(within(alerta).getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByRole("button", { name: /^09:00 · AAA1B25/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it("vazio: traz o botão 'Reservar veículo' junto do aviso", async () => {
    simular([]);
    agenda();

    const aviso = (await screen.findByText(/Nenhum uso agendado neste período/)).parentElement!;
    expect(within(aviso).queryByText(/Você vê só as suas reservas/)).not.toBeInTheDocument();

    const reservar = within(aviso).getByRole("button", { name: "Reservar veículo" });
    expect(reservar).toHaveClass("h-11");
    await userEvent.click(reservar);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("vazio para o motorista: avisa que ele vê só as reservas dele", async () => {
    simular([]);
    agenda({ id: 3, name: "Maria", email: "maria@frota.test", papel: "motorista", permissoes: ["usos"], centro_do_motorista: null });

    expect(await screen.findByText(/Nenhum uso agendado neste período\. Você vê só as suas reservas\./)).toBeInTheDocument();
  });
});
