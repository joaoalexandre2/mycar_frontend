import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { CapturaHodometro } from "./CapturaHodometro";
import { UsoDetalheModal } from "./UsoDetalheModal";
import { ImportarPlanilhaModal } from "./ImportarPlanilhaModal";
import { ErroDePlanilha, usosService } from "../../services/frota";
import type { UsoVeiculo } from "../../types/frota";

const fotoReduzida = new Blob(["jpeg"], { type: "image/jpeg" });

vi.mock("../../utils/imagem", async (original) => ({
  ...(await original<typeof import("../../utils/imagem")>()),
  redimensionar: vi.fn(async () => fotoReduzida),
}));

beforeEach(() => {
  // O jsdom não implementa links temporários de arquivo.
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

// ------------------------------------------------------------ CapturaHodometro

function Captura() {
  const [km, setKm] = useState("");
  const [foto, setFoto] = useState<Blob | null>(null);

  return (
    <>
      <CapturaHodometro rotulo="Km de saída" km={km} onKm={setKm} foto={foto} onFoto={setFoto} dica="Último km: 45.200 km." />
      <output data-testid="estado">{`${km}|${foto ? "com-foto" : "sem-foto"}`}</output>
    </>
  );
}

describe("CapturaHodometro", () => {
  it("lê o km digitado e mostra a dica", async () => {
    render(<Captura />);

    await userEvent.type(screen.getByLabelText("Km de saída"), "45310");

    expect(screen.getByTestId("estado")).toHaveTextContent("45310|sem-foto");
    expect(screen.getByText("Último km: 45.200 km.")).toBeInTheDocument();
  });

  it("reduz a foto escolhida, mostra a prévia e deixa tirar", async () => {
    render(<Captura />);

    const foto = new File(["painel"], "painel.jpg", { type: "image/jpeg" });
    await userEvent.upload(screen.getByTestId("entrada-foto-hodometro"), foto);

    expect(await screen.findByAltText("Prévia da foto do hodômetro")).toBeInTheDocument();
    expect(screen.getByTestId("estado")).toHaveTextContent("|com-foto");
    expect(screen.getByRole("button", { name: /Trocar foto/ })).toBeInTheDocument();

    await userEvent.click(screen.getByTitle("Tirar a foto"));

    expect(screen.getByTestId("estado")).toHaveTextContent("|sem-foto");
    expect(screen.queryByAltText("Prévia da foto do hodômetro")).not.toBeInTheDocument();
  });

  it("recusa arquivo que não é imagem", async () => {
    render(<Captura />);

    const texto = new File(["x"], "nota.txt", { type: "text/plain" });
    // applyAccept desligado: simula quem escolheu "todos os arquivos" no seletor.
    await userEvent.setup({ applyAccept: false }).upload(screen.getByTestId("entrada-foto-hodometro"), texto);

    expect(await screen.findByRole("alert")).toHaveTextContent("Escolha uma imagem");
    expect(screen.getByTestId("estado")).toHaveTextContent("|sem-foto");
  });
});

// ------------------------------------------------------------- UsoDetalheModal

function detalhe(u: UsoVeiculo, extra: Partial<React.ComponentProps<typeof UsoDetalheModal>> = {}) {
  const props = {
    uso: u,
    onAtualizado: vi.fn(),
    onRemovido: vi.fn(),
    onEditar: vi.fn(),
    onClose: vi.fn(),
    ...extra,
  };

  render(
    <NotificacoesProvider>
      <UsoDetalheModal {...props} />
    </NotificacoesProvider>,
  );

  return props;
}

describe("UsoDetalheModal", () => {
  it("mostra quem, quando e para quê, com o último km do veículo", () => {
    detalhe(uso());

    expect(screen.getByText("AAA1B25 · Strada")).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("Entregas")).toBeInTheDocument();
    expect(screen.getByText("Visita a clientes")).toBeInTheDocument();
    expect(screen.getByText("Último km registrado: 45.200 km.")).toBeInTheDocument();
    expect(screen.getByText("Agendado")).toBeInTheDocument();
  });

  it("registra a saída com o km e a foto do hodômetro", async () => {
    const saida = vi.spyOn(usosService, "registrarSaida").mockResolvedValue(uso({ status: "em_uso", kmSaida: 45200 }));
    const props = detalhe(uso());

    await userEvent.type(screen.getByLabelText("Km de saída"), "45200");
    await userEvent.upload(screen.getByTestId("entrada-foto-hodometro"), new File(["p"], "p.jpg", { type: "image/jpeg" }));
    await screen.findByAltText("Prévia da foto do hodômetro");
    await userEvent.click(screen.getByRole("button", { name: "Registrar saída" }));

    await waitFor(() => expect(saida).toHaveBeenCalledWith(7, 45200, fotoReduzida));
    expect(props.onAtualizado).toHaveBeenCalledWith(expect.objectContaining({ status: "em_uso" }));
  });

  it("sem foto, registra só o km", async () => {
    const saida = vi.spyOn(usosService, "registrarSaida").mockResolvedValue(uso({ status: "em_uso" }));
    detalhe(uso());

    await userEvent.type(screen.getByLabelText("Km de saída"), "45.200");
    await userEvent.click(screen.getByRole("button", { name: "Registrar saída" }));

    await waitFor(() => expect(saida).toHaveBeenCalledWith(7, 45200, null));
  });

  it("não envia km inválido e avisa", async () => {
    const saida = vi.spyOn(usosService, "registrarSaida");
    detalhe(uso());

    await userEvent.type(screen.getByLabelText("Km de saída"), "abc");
    await userEvent.click(screen.getByRole("button", { name: "Registrar saída" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe o km do hodômetro");
    expect(saida).not.toHaveBeenCalled();
  });

  it("mostra a recusa do servidor (hodômetro menor que o último km)", async () => {
    vi.spyOn(usosService, "registrarSaida").mockRejectedValue(
      Object.assign(new Error("422"), {
        isAxiosError: true,
        response: { status: 422, data: { message: "O hodômetro informado (9000 km) é menor que o último registrado (10000 km)." } },
      }),
    );
    detalhe(uso());

    await userEvent.type(screen.getByLabelText("Km de saída"), "9000");
    await userEvent.click(screen.getByRole("button", { name: "Registrar saída" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("menor que o último registrado (10000 km)");
  });

  it("em uso, pede a chegada e lembra com quanto saiu", async () => {
    const chegada = vi.spyOn(usosService, "registrarChegada").mockResolvedValue(uso({ status: "concluido", kmSaida: 45200, kmChegada: 45310, kmRodados: 110 }));
    const props = detalhe(uso({ status: "em_uso", kmSaida: 45200 }));

    expect(screen.getByText("Saiu com 45.200 km.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Km de chegada"), "45310");
    await userEvent.click(screen.getByRole("button", { name: "Registrar chegada" }));

    await waitFor(() => expect(chegada).toHaveBeenCalledWith(7, 45310, null));
    expect(props.onAtualizado).toHaveBeenCalled();
  });

  it("concluído mostra os km rodados e os links das fotos, sem pedir saída nem chegada", () => {
    detalhe(
      uso({
        status: "concluido",
        kmSaida: 45200,
        kmChegada: 45310,
        kmRodados: 110,
        urlFotoSaida: "https://api.exemplo.com/foto-saida",
      }),
    );

    expect(screen.getByText("110 km")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver foto" })).toHaveAttribute("href", "https://api.exemplo.com/foto-saida");
    expect(screen.getByText("sem foto")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar saída" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar chegada" })).not.toBeInTheDocument();
  });

  it("uso importado da planilha não pede foto (as viagens já aconteceram)", () => {
    detalhe(uso({ status: "concluido", kmSaida: 100, kmChegada: 200, kmRodados: 100, origem: "planilha" }));

    expect(screen.getByText("Importado da planilha")).toBeInTheDocument();
    expect(screen.queryByText("Hodômetro na saída:")).not.toBeInTheDocument();
  });

  it("cancelar pede confirmação e só vale para agendado", async () => {
    const cancelar = vi.spyOn(usosService, "cancelar").mockResolvedValue(uso({ status: "cancelado" }));
    const props = detalhe(uso());

    await userEvent.click(screen.getByRole("button", { name: "Cancelar reserva" }));

    // Antes de confirmar, nada é cancelado.
    const dialogo = await screen.findByText(/O horário volta a ficar livre/);
    expect(cancelar).not.toHaveBeenCalled();
    expect(dialogo).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(cancelar).toHaveBeenCalledWith(7));
    expect(props.onAtualizado).toHaveBeenCalledWith(expect.objectContaining({ status: "cancelado" }));
  });

  it("em uso não oferece cancelar, mas oferece editar", () => {
    detalhe(uso({ status: "em_uso", kmSaida: 45200 }));

    expect(screen.queryByRole("button", { name: "Cancelar reserva" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Editar/ })).toBeInTheDocument();
  });
});

// ------------------------------------------------------- ImportarPlanilhaModal

function importar(onImportado = vi.fn()) {
  render(<ImportarPlanilhaModal onImportado={onImportado} onClose={vi.fn()} />);

  return onImportado;
}

const csv = () => new File(["placa;data_saida"], "uso.csv", { type: "text/csv" });

describe("ImportarPlanilhaModal", () => {
  it("só confere depois de escolher o arquivo, e importar exige a conferência", async () => {
    const importarServico = vi
      .spyOn(usosService, "importar")
      .mockResolvedValueOnce({ usos: 2, veiculos: 1, kmRodados: 200, motoristasNovos: [], centrosNovos: [], gravado: false })
      .mockResolvedValueOnce({ usos: 2, veiculos: 1, kmRodados: 200, motoristasNovos: [], centrosNovos: [], gravado: true });
    const onImportado = importar();

    expect(screen.getByRole("button", { name: "Conferir" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /^Importar \d/ })).not.toBeInTheDocument();

    await userEvent.upload(screen.getByLabelText("Planilha (CSV)"), csv());
    await userEvent.click(screen.getByRole("button", { name: "Conferir" }));

    expect(await screen.findByText(/Nada foi gravado ainda/)).toBeInTheDocument();
    expect(screen.getByText(/2 usos em 1 veículo, 200 km rodados/)).toBeInTheDocument();
    expect(onImportado).not.toHaveBeenCalled();
    expect(importarServico).toHaveBeenLastCalledWith(expect.any(File), { simular: true, criarFaltantes: false });

    await userEvent.click(screen.getByRole("button", { name: "Importar 2 usos" }));

    expect(await screen.findByText("Planilha importada.")).toBeInTheDocument();
    expect(importarServico).toHaveBeenLastCalledWith(expect.any(File), { simular: false, criarFaltantes: false });
    expect(onImportado).toHaveBeenCalledTimes(1);
    // O "Fechar" do rodapé substitui "Cancelar" (o do cabeçalho do diálogo continua).
    expect(screen.getAllByRole("button", { name: "Fechar" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
  });

  it("lista as linhas com problema e não oferece importar", async () => {
    vi.spyOn(usosService, "importar").mockRejectedValue(
      new ErroDePlanilha({
        mensagem: "3 problema(s) na planilha. Nada foi importado.",
        erros: ["linha 3: placa \"ZZZ9Z99\" não está cadastrada", "linha 5: km de chegada (400) menor que o de saída (500)"],
        totalDeErros: 3,
      }),
    );
    importar();

    await userEvent.upload(screen.getByLabelText("Planilha (CSV)"), csv());
    await userEvent.click(screen.getByRole("button", { name: "Conferir" }));

    expect(await screen.findByText("3 problema(s) na planilha. Nada foi importado.")).toBeInTheDocument();
    expect(screen.getByText(/linha 3: placa "ZZZ9Z99" não está cadastrada/)).toBeInTheDocument();
    expect(screen.getByText(/e mais 1\. Corrija os primeiros/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Importar \d/ })).not.toBeInTheDocument();
  });

  it("mudar a opção invalida a conferência e passa a opção ao servidor", async () => {
    const importarServico = vi
      .spyOn(usosService, "importar")
      .mockResolvedValue({ usos: 1, veiculos: 1, kmRodados: 10, motoristasNovos: ["Pedro Novo"], centrosNovos: [], gravado: false });
    importar();

    await userEvent.upload(screen.getByLabelText("Planilha (CSV)"), csv());
    await userEvent.click(screen.getByRole("button", { name: "Conferir" }));
    expect(await screen.findByRole("button", { name: "Importar 1 uso" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox"));

    // A conferência anterior não vale mais: some o resumo e o botão de importar.
    expect(screen.queryByRole("button", { name: "Importar 1 uso" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Conferir" }));

    expect(await screen.findByText(/Motoristas novos: Pedro Novo/)).toBeInTheDocument();
    expect(importarServico).toHaveBeenLastCalledWith(expect.any(File), { simular: true, criarFaltantes: true });
  });

  it("baixa a planilha-modelo", async () => {
    const baixar = vi.spyOn(usosService, "baixarModelo").mockResolvedValue(new Blob(["placa"], { type: "text/csv" }));
    const clique = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    importar();

    await userEvent.click(screen.getByRole("button", { name: /Baixar planilha-modelo/ }));

    await waitFor(() => expect(baixar).toHaveBeenCalled());
    expect(clique).toHaveBeenCalled();
  });
});
