import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResumoConta, VeiculoConta, Vencimento } from "../../types/conta";
import type { Usuario } from "../../types/auth";
import { mapearVeiculoConta } from "../../services/conta/veiculos";
import { mensagemKmDesconhecida, situacaoPorKm } from "../../utils/avisoPorKm";
import { CartaoVeiculo } from "./CartaoVeiculo";
import { ContaInicio } from "./ContaInicio";
import { Atualizacoes } from "../../components/layout/Atualizacoes";

const auth = vi.hoisted(() => ({ usuario: null as Usuario | null }));
const resumoMock = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ usuario: auth.usuario }),
}));

vi.mock("../../services/conta", () => ({
  contaService: { resumo: resumoMock },
}));

const gestor = { id: 1, name: "Ana Souza", email: "a@x.com", perfil: "frota", papel: "gestor" } as unknown as Usuario;
const motorista = { ...gestor, papel: "motorista" } as unknown as Usuario;

const acoes = {
  atualizarFipe: vi.fn(),
  fotos: vi.fn(),
  despesas: vi.fn(),
  documentos: vi.fn(),
  seguro: vi.fn(),
  abastecimentos: vi.fn(),
  editar: vi.fn(),
  remover: vi.fn(),
  corrigirKm: vi.fn(),
};

const base: VeiculoConta = {
  id: 7,
  apelido: "Doblô",
  placa: "FJB4E12",
  marca: "Fiat",
  modelo: "Doblô",
  ano: 2018,
  anoFabricacao: null,
  anoCompleto: "2018",
  isentoIpva: false,
  possivelIsencaoIpva: false,
  fotoCapaUrl: null,
  fotoModelo: null,
  uf: "RS",
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
};

function linhaDoKm() {
  return screen.getByText(/Km atual/).closest("p") as HTMLElement;
}

describe("Cartão do veículo: km conhecida", () => {
  it("mostra a km efetiva do backend com a data e a origem, e oferece corrigir", () => {
    render(
      <CartaoVeiculo
        veiculo={{ ...base, kmConhecida: 50500, kmConhecidaEm: "2026-11-17", kmConhecidaOrigem: "abastecimento" }}
        nome="Doblô"
        consultandoFipe={false}
        acoes={acoes}
      />,
    );

    const linha = linhaDoKm();
    expect(linha).toHaveTextContent(/50\.500/);
    expect(linha).toHaveTextContent("em 17/11/2026");
    expect(linha).toHaveTextContent("(abastecimento)");
    expect(within(linha).getByRole("button", { name: "corrigir" })).toBeInTheDocument();
  });

  it("sem km nenhuma, pede para informar", () => {
    render(
      <CartaoVeiculo veiculo={{ ...base, kmConhecida: null }} nome="Doblô" consultandoFipe={false} acoes={acoes} />,
    );

    expect(within(linhaDoKm()).getByRole("button", { name: "informar" })).toBeInTheDocument();
  });

  it("backend antigo, sem o campo novo: continua mostrando o km_atual", () => {
    render(
      <CartaoVeiculo
        veiculo={{ ...base, kmAtual: 32000, kmAtualizadoEm: "2026-10-01" }}
        nome="Doblô"
        consultandoFipe={false}
        acoes={acoes}
      />,
    );

    const linha = linhaDoKm();
    expect(linha).toHaveTextContent(/32\.000/);
    expect(linha).toHaveTextContent("em 01/10/2026");
    expect(within(linha).getByRole("button", { name: "corrigir" })).toBeInTheDocument();
  });

  it("quem não corrige km (pessoa/motorista) não vê a linha sem km nem o botão", () => {
    const { corrigirKm: _ignorado, ...semCorrigir } = acoes;
    void _ignorado;
    render(<CartaoVeiculo veiculo={base} nome="Doblô" consultandoFipe={false} acoes={semCorrigir} />);

    expect(screen.queryByText(/Km atual/)).not.toBeInTheDocument();
  });
});

describe("mapearVeiculoConta: km_conhecida", () => {
  const api = { id: 1, placa: "FJB4E12", marca: "Fiat", modelo: "Doblô", ano: 2018, km_atual: null };

  it("lê o campo novo", () => {
    const v = mapearVeiculoConta({ ...api, km_conhecida: { km: 50500, origem: "servico", em: "2026-11-17" } });

    expect(v.kmConhecida).toBe(50500);
    expect(v.kmConhecidaEm).toBe("2026-11-17");
    expect(v.kmConhecidaOrigem).toBe("servico");
    expect(v.kmAtual).toBeNull();
  });

  it("tolera o campo ausente ou nulo", () => {
    expect(mapearVeiculoConta(api).kmConhecida).toBeNull();
    expect(mapearVeiculoConta({ ...api, km_conhecida: null }).kmConhecida).toBeNull();
  });
});

describe("situacaoPorKm", () => {
  it("desconhecido nunca vira vencido", () => {
    expect(situacaoPorKm(null).tipo).toBe("desconhecida");
    expect(situacaoPorKm(undefined).tipo).toBe("desconhecida");
    expect(situacaoPorKm(0).tipo).toBe("passou");
    expect(situacaoPorKm(-500).tipo).toBe("passou");
    expect(situacaoPorKm(300).tipo).toBe("faltam");
  });

  it("monta o pedido de km", () => {
    expect(mensagemKmDesconhecida("Doblô", "Pneus")).toBe("Informe a km de Doblô para acompanhar a troca de pneus");
    expect(mensagemKmDesconhecida("Uno", "Troca de óleo")).toBe("Informe a km de Uno para acompanhar a troca de óleo");
  });
});

function vencimentoKm(kmRestante: number | null | undefined, extra: Partial<Vencimento> = {}): Vencimento {
  return {
    tipo: "servico",
    rotulo: "Pneus",
    kmRestante,
    proximaKm: 50000,
    porKm: true,
    veiculoId: 7,
    veiculo: "Doblô",
    placa: "FJB4E12",
    data: "2026-11-22",
    dias: 0,
    valorEstimado: null,
    ...extra,
  };
}

function resumoCom(vencimentos: Vencimento[]): ResumoConta {
  return {
    nomeConta: "Frota X",
    tipoConta: "frota",
    totalVeiculos: 1,
    valorTotalFipe: 0,
    diasAFrente: 60,
    consumo: { kmPorLitro: null, precoMedioLitro: null, veiculosComDados: 0 },
    gastoMes: { total: 0, combustivel: 0, servicos: 0 },
    vencimentos,
  } as ResumoConta;
}

describe("Início da conta: aviso por km", () => {
  beforeEach(() => {
    auth.usuario = gestor;
    resumoMock.mockReset();
  });

  it("km desconhecida: pede a km com ação para informar, sem dizer que passou", async () => {
    resumoMock.mockResolvedValue(resumoCom([vencimentoKm(null)]));
    render(<ContaInicio />, { wrapper: MemoryRouter });

    expect(await screen.findByText(/Informe a km de Doblô para acompanhar a troca de pneus/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Informar km" })).toHaveAttribute("href", "/veiculos");
    expect(screen.queryByText("já passou")).not.toBeInTheDocument();
  });

  it("motorista vê o pedido, mas sem a ação de informar", async () => {
    auth.usuario = motorista;
    resumoMock.mockResolvedValue(resumoCom([vencimentoKm(undefined)]));
    render(<ContaInicio />, { wrapper: MemoryRouter });

    expect(await screen.findByText(/Informe a km de Doblô/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Informar km" })).not.toBeInTheDocument();
  });

  it("já passou só quando a km conhecida passou do alvo", async () => {
    resumoMock.mockResolvedValue(
      resumoCom([vencimentoKm(-500), vencimentoKm(300, { rotulo: "Bateria", data: "2026-11-21" })]),
    );
    render(<ContaInicio />, { wrapper: MemoryRouter });

    expect(await screen.findAllByText("já passou")).toHaveLength(1);
    expect(screen.getByText(/^300/)).toBeInTheDocument();
    expect(screen.queryByText(/Informe a km/)).not.toBeInTheDocument();
  });
});

describe("Sininho de atualizações: aviso por km", () => {
  beforeEach(() => {
    auth.usuario = gestor;
    resumoMock.mockReset();
  });

  it("km desconhecida: pede a km; km conhecida que passou: já passou", async () => {
    resumoMock.mockResolvedValue(
      resumoCom([vencimentoKm(null), vencimentoKm(-1, { rotulo: "Troca de óleo", data: "2026-11-20" })]),
    );
    render(<Atualizacoes />, { wrapper: MemoryRouter });

    await userEvent.click(await screen.findByRole("button", { name: /Atualizações/ }));

    const painel = await screen.findByRole("region", { name: "Atualizações" });
    expect(await within(painel).findByText(/Informe a km de Doblô para acompanhar a troca de pneus/)).toBeInTheDocument();
    expect(within(painel).getByRole("link", { name: "Informar km" })).toHaveAttribute("href", "/veiculos");
    expect(within(painel).getAllByText("já passou")).toHaveLength(1);
    expect(within(painel).getByText("sem km")).toBeInTheDocument();
  });
});
