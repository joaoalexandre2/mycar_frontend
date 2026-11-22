import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { UsoDetalheModal } from "./UsoDetalheModal";
import { usosService } from "../../services/frota";
import type { UsoVeiculo } from "../../types/frota";

const fotoReduzida = new Blob(["jpeg"], { type: "image/jpeg" });

vi.mock("../../utils/imagem", async (original) => ({
  ...(await original<typeof import("../../utils/imagem")>()),
  redimensionar: vi.fn(async () => fotoReduzida),
}));

vi.mock("../../utils/ocrHodometro", async (original) => ({
  ...(await original<typeof import("../../utils/ocrHodometro")>()),
  lerKmDoVisor: vi.fn(async () => null),
}));

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:previa");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => vi.restoreAllMocks());

function uso(parcial: Partial<UsoVeiculo> = {}): UsoVeiculo {
  return {
    id: 7,
    veiculoId: 3,
    veiculo: { id: 3, nome: "Strada", placa: "AAA1B25", kmAtual: 45200 },
    motoristaId: 2,
    motorista: "Maria Silva",
    centroCustoId: 5,
    centroCusto: "Entregas",
    inicioPrevisto: "2026-11-10T08:00",
    fimPrevisto: "2026-11-10T12:00",
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

function abrir(u: UsoVeiculo = uso()) {
  const onClose = vi.fn();
  const onAtualizado = vi.fn();
  const valor = {
    usuario: { id: 1, name: "Ana", email: "ana@x.com", perfil: "frota", papel: "motorista" },
    autenticado: true,
  } as unknown as AuthContextValor;

  render(
    <AuthContext.Provider value={valor}>
      <NotificacoesProvider>
        <UsoDetalheModal uso={u} onAtualizado={onAtualizado} onRemovido={vi.fn()} onEditar={vi.fn()} onClose={onClose} />
      </NotificacoesProvider>
    </AuthContext.Provider>,
  );

  return { onClose, onAtualizado };
}

/** O fundo escuro em volta do painel: é nele que o clique "fora" acontece. */
function fundo() {
  return screen.getByRole("dialog").parentElement as HTMLElement;
}

async function preencherTudo() {
  await userEvent.type(screen.getByLabelText("Km de saída"), "45300");
  await userEvent.upload(screen.getByTestId("entrada-foto-hodometro"), new File(["p"], "p.jpg", { type: "image/jpeg" }));
  await screen.findByAltText("Prévia da foto do hodômetro");
  const motivo = screen.getByLabelText("Motivo");
  await userEvent.clear(motivo);
  await userEvent.type(motivo, "Entrega em Campinas");
}

const formas: [string, () => Promise<void>][] = [
  ["clique fora", async () => void fireEvent.mouseDown(fundo())],
  ["Esc", async () => userEvent.keyboard("{Escape}")],
  ["botão Fechar", async () => userEvent.click(screen.getByRole("button", { name: "Fechar" }))],
];

describe("UsoDetalheModal: descartar o que foi digitado", () => {
  it.each(formas)("sem nada digitado, %s fecha direto", async (_nome, fechar) => {
    const { onClose } = abrir();

    await fechar();

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it.each(formas)("com o km digitado, %s pede confirmação antes de fechar", async (_nome, fechar) => {
    const { onClose } = abrir();

    await userEvent.type(screen.getByLabelText("Km de saída"), "45300");
    await fechar();

    const pergunta = await screen.findByRole("alertdialog", { name: "Descartar o que você digitou?" });
    expect(pergunta).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar editando" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descartar" })).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("só a foto ou só o motivo também contam como digitado", async () => {
    const { onClose } = abrir();

    await userEvent.type(screen.getByLabelText("Motivo"), " extra");
    await userEvent.keyboard("{Escape}");

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    await userEvent.clear(screen.getByLabelText("Motivo"));
    await userEvent.type(screen.getByLabelText("Motivo"), "Visita a clientes");

    await userEvent.upload(screen.getByTestId("entrada-foto-hodometro"), new File(["p"], "p.jpg", { type: "image/jpeg" }));
    await screen.findByAltText("Prévia da foto do hodômetro");
    fireEvent.mouseDown(fundo());

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("\"Continuar editando\" mantém km, foto e motivo", async () => {
    const { onClose } = abrir();

    await preencherTudo();
    fireEvent.mouseDown(fundo());
    await userEvent.click(await screen.findByRole("button", { name: "Continuar editando" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Km de saída")).toHaveValue("45300");
    expect(screen.getByLabelText("Motivo")).toHaveValue("Entrega em Campinas");
    expect(screen.getByAltText("Prévia da foto do hodômetro")).toBeInTheDocument();
  });

  it("\"Descartar\" fecha o modal", async () => {
    const { onClose } = abrir();

    await preencherTudo();
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    await userEvent.click(await screen.findByRole("button", { name: "Descartar" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("uso já concluído (sem formulário) fecha direto", async () => {
    const { onClose } = abrir(uso({ status: "concluido", kmSaida: 45200, kmChegada: 45300, kmRodados: 100 }));

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

function erroDeRede() {
  return new AxiosError("Network Error", "ERR_NETWORK", { headers: {} } as InternalAxiosRequestConfig);
}

describe("UsoDetalheModal: sem conexão no registro", () => {
  it("oferece \"Tentar de novo\" e reenvia os mesmos km, foto e motivo", async () => {
    const atualizado = uso({ status: "em_uso", kmSaida: 45300 });
    const saida = vi
      .spyOn(usosService, "registrarSaida")
      .mockRejectedValueOnce(erroDeRede())
      .mockResolvedValueOnce(atualizado);
    const { onAtualizado } = abrir();

    await preencherTudo();
    await userEvent.click(screen.getByRole("button", { name: "Registrar saída" }));

    expect(await screen.findByText("Sem conexão. Os dados digitados continuam aqui. Tente de novo.")).toBeInTheDocument();
    // Os dados continuam na tela.
    expect(screen.getByLabelText("Km de saída")).toHaveValue("45300");

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));

    await waitFor(() => expect(onAtualizado).toHaveBeenCalledWith(atualizado));
    expect(saida).toHaveBeenCalledTimes(2);
    expect(saida.mock.calls[1]).toEqual([7, 45300, fotoReduzida, "Entrega em Campinas"]);
    expect(saida.mock.calls[1]).toEqual(saida.mock.calls[0]);
  });

  it("erro que não é de conexão (ex.: 422) não oferece \"Tentar de novo\"", async () => {
    const erro = new AxiosError("422", "ERR_BAD_REQUEST", { headers: {} } as InternalAxiosRequestConfig, null, {
      status: 422,
      statusText: "",
      headers: {},
      config: { headers: {} } as InternalAxiosRequestConfig,
      data: { message: "A saída só pode ser registrada em um uso agendado." },
    });
    vi.spyOn(usosService, "registrarSaida").mockRejectedValue(erro);
    abrir();

    await userEvent.type(screen.getByLabelText("Km de saída"), "45300");
    await userEvent.click(screen.getByRole("button", { name: "Registrar saída" }));

    expect(await screen.findByText("A saída só pode ser registrada em um uso agendado.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
  });

  it("mexer no km depois da falha tira a oferta de reenviar os valores antigos", async () => {
    vi.spyOn(usosService, "registrarSaida").mockRejectedValue(erroDeRede());
    abrir();

    await userEvent.type(screen.getByLabelText("Km de saída"), "45300");
    await userEvent.click(screen.getByRole("button", { name: "Registrar saída" }));
    await screen.findByRole("button", { name: "Tentar de novo" });

    await userEvent.type(screen.getByLabelText("Km de saída"), "1");

    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
  });
});
