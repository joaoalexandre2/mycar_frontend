import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResumoConta, Vencimento } from "../../types/conta";
import type { Usuario } from "../../types/auth";
import { ContaInicio } from "./ContaInicio";

/*
 * Tela inicial da conta no celular (abaixo de md): tudo compacto para caber sem
 * rolar. O jsdom não aplica o CSS do Tailwind, então aqui se confere a estrutura
 * (as classes max-md:/md:) e o que continua no DOM para o leitor de tela.
 */

const auth = vi.hoisted(() => ({ usuario: null as Usuario | null }));
const resumoMock = vi.hoisted(() => vi.fn());

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ usuario: auth.usuario }),
}));

vi.mock("../../services/conta", () => ({
  contaService: { resumo: resumoMock },
}));

const gestor = {
  id: 1,
  name: "Ana Souza",
  email: "a@x.com",
  perfil: "frota",
  papel: "gestor",
  conta: "Transportes X",
} as unknown as Usuario;
const pessoa = { id: 2, name: "Bia Lima", email: "b@x.com", perfil: "pessoa" } as unknown as Usuario;

function vencimento(n: number): Vencimento {
  return {
    tipo: "revisao",
    veiculoId: n,
    veiculo: `Carro ${n}`,
    placa: `AAA${1000 + n}`,
    data: `2026-12-${String(n).padStart(2, "0")}`,
    dias: n * 3,
    valorEstimado: null,
  };
}

function resumo(qtd: number, extra: Partial<ResumoConta> = {}): ResumoConta {
  return {
    nomeConta: "Transportes X",
    tipoConta: "frota",
    totalVeiculos: 3,
    valorTotalFipe: 202669,
    diasAFrente: 60,
    consumo: { kmPorLitro: 5.2, precoMedioLitro: 3.07, veiculosComDados: 2 },
    gastoMes: { total: 3839, combustivel: 639, servicos: 3200 },
    vencimentos: Array.from({ length: qtd }, (_, i) => vencimento(i + 1)),
    ...extra,
  };
}

function itensDaLista() {
  return within(screen.getByRole("list")).getAllByRole("listitem");
}

async function abrir(qtd: number, extra: Partial<ResumoConta> = {}) {
  resumoMock.mockResolvedValue(resumo(qtd, extra));
  render(<ContaInicio />, { wrapper: MemoryRouter });
  await screen.findByText(/R\$\s3\.839,00/);
}

beforeEach(() => {
  auth.usuario = gestor;
  resumoMock.mockReset();
});

describe("Início da conta no celular: topo e números", () => {
  it("o subtítulo sai da vista no celular, mas fica para o leitor de tela", async () => {
    await abrir(2);

    const subtitulo = screen.getByText("Visão geral da frota Transportes X.");
    expect(subtitulo).toHaveClass("max-md:sr-only");
    expect(subtitulo).not.toHaveClass("sr-only");
  });

  it("o botão de veículos tem 44px no celular e mantém o nome completo", async () => {
    await abrir(2);

    const link = screen.getByRole("link", { name: "Gerenciar veículos" });
    expect(link).toHaveAttribute("href", "/veiculos");
    expect(link).toHaveClass("max-md:h-11");
    expect(within(link).getByText("Veículos")).toHaveClass("md:hidden");
  });

  it("perfil pessoa continua com o próprio texto", async () => {
    auth.usuario = pessoa;
    await abrir(1, { tipoConta: "pessoa", totalVeiculos: 1 });

    expect(screen.getByText("Veja como está o seu carro e o que vence em breve.")).toHaveClass("max-md:sr-only");
    expect(screen.getByRole("link", { name: "Meus veículos" })).toBeInTheDocument();
    // Pessoa: "Veículos" já é curto, então não há rótulo curto duplicado.
    expect(screen.getByText("Veículos")).not.toHaveAttribute("aria-hidden");
  });

  it("os quatro números ficam sempre em 2 colunas, com o detalhe só para o leitor de tela", async () => {
    await abrir(2);

    const grade = screen.getByText("Valor na FIPE").closest(".grid") as HTMLElement;
    expect(grade).toHaveClass("grid-cols-2");
    expect(grade).not.toHaveClass("grid-cols-1");

    for (const titulo of ["Veículos da frota", "Valor na FIPE", "Combustível no mês", "Serviços no mês"]) {
      expect(screen.getByText(titulo)).toHaveClass("max-md:sr-only");
    }
    for (const curto of ["FIPE", "Combustível/mês", "Serviços/mês"]) {
      expect(screen.getByText(curto)).toHaveAttribute("aria-hidden", "true");
    }
    expect(screen.getByText("Soma dos veículos consultados")).toHaveClass("max-md:sr-only");
  });

  it("valor longo fica no contêiner fluido (quebra em vez de rolar de lado)", async () => {
    await abrir(2, { valorTotalFipe: 1202669 });

    const valor = screen.getByText(/R\$\s1\.202\.669,00/);
    expect(valor).toHaveClass("valor-fluido");
    expect(valor.parentElement).toHaveClass("valor-fluido-pai");
  });

  it("velocímetro compacto continua acessível, com os números da escala maiores no celular", async () => {
    await abrir(2);

    const svg = screen.getByRole("img", { name: "Consumo médio de 5,2 quilômetros por litro" });
    const escala = svg.querySelector("g[font-size='9']");
    expect(escala).toHaveClass("max-md:text-[16px]");
    expect(screen.getByText(/R\$\s3,07/)).toBeInTheDocument();
  });
});

describe("Início da conta no celular: o que vence em breve", () => {
  it("o aviso de IPVA e licenciamento fica no DOM (sr-only) e abre pelo botão", async () => {
    await abrir(2);

    const aviso = screen.getByText(/confirme no site do Detran\/Sefaz/);
    expect(aviso).toHaveClass("max-md:sr-only");

    const botao = screen.getByRole("button", { name: /Estimativas: aviso sobre IPVA e licenciamento/ });
    expect(botao).toHaveClass("md:hidden", "h-11", "w-11");
    expect(botao).toHaveAttribute("aria-controls", aviso.id);
    expect(botao).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(botao);

    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(aviso).not.toHaveClass("max-md:sr-only");
  });

  it("0 vencimentos: mostra o aviso de nada a vencer e nenhum Ver todos", async () => {
    await abrir(0);

    expect(screen.getByText(/Nada vence nos próximos 60 dias/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ver todos/ })).not.toBeInTheDocument();
  });

  it.each([1, 2])("%i vencimento(s): todos visíveis e sem Ver todos", async (qtd) => {
    await abrir(qtd);

    const itens = itensDaLista();
    expect(itens).toHaveLength(qtd);
    itens.forEach((li) => expect(li).not.toHaveClass("max-md:hidden"));
    expect(screen.queryByRole("button", { name: /Ver todos/ })).not.toBeInTheDocument();
  });

  it.each([
    [3, 1],
    [6, 4],
  ])("%i vencimentos: 2 visíveis no celular, %i atrás do Ver todos, e todos no desktop", async (qtd, escondidos) => {
    await abrir(qtd);

    const itens = itensDaLista();
    // Todos continuam no DOM: a partir de md a lista é a mesma de antes.
    expect(itens).toHaveLength(qtd);
    expect(itens.slice(0, 2).every((li) => !li.classList.contains("max-md:hidden"))).toBe(true);
    expect(itens.filter((li) => li.classList.contains("max-md:hidden"))).toHaveLength(escondidos);
    itens.forEach((li) => expect(li.className).not.toMatch(/(^|\s)hidden(\s|$)/));

    const verTodos = screen.getByRole("button", { name: `Ver todos (${qtd})` });
    expect(verTodos).toHaveClass("md:hidden", "h-11");
    expect(verTodos).toHaveAttribute("aria-expanded", "false");
    expect(verTodos).toHaveAttribute("aria-controls", screen.getByRole("list").id);

    await userEvent.click(verTodos);

    expect(verTodos).toHaveAttribute("aria-expanded", "true");
    expect(verTodos).toHaveTextContent("Ver menos");
    itensDaLista().forEach((li) => expect(li).not.toHaveClass("max-md:hidden"));
  });

  it("carregando: sem lista e sem Ver todos", async () => {
    resumoMock.mockReturnValue(new Promise(() => {}));
    render(<ContaInicio />, { wrapper: MemoryRouter });

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ver todos/ })).not.toBeInTheDocument();
  });

  it("erro: mostra o alerta e nenhum Ver todos", async () => {
    resumoMock.mockRejectedValue(new Error("Falhou"));
    render(<ContaInicio />, { wrapper: MemoryRouter });

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ver todos/ })).not.toBeInTheDocument();
  });

  it("sem veículos: o link de cadastrar tem 44px de toque no celular", async () => {
    await abrir(0, { totalVeiculos: 0 });

    expect(screen.getByRole("link", { name: "Cadastrar o primeiro veículo" })).toHaveClass("max-md:min-h-11");
  });
});
