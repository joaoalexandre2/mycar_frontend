import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import api from "../../services/api";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext } from "../../contexts/authContextDefinition";
import type { Usuario } from "../../types/auth";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { EsqueciSenha } from "../../pages/EsqueciSenha/EsqueciSenha";
import { RedefinirSenha } from "../../pages/RedefinirSenha/RedefinirSenha";

const frota: Usuario = { id: 3, name: "Frota", email: "f@mycar.local", perfil: "frota" };

function comUsuario(usuario: Usuario, rota: string, filho: React.ReactNode) {
  return render(
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: true,
        entrar: async () => {},
        sair: async () => {},
        atualizarUsuario: () => {},
      }}
    >
      <NotificacoesProvider>
        <MemoryRouter initialEntries={[rota]}>{filho}</MemoryRouter>
      </NotificacoesProvider>
    </AuthContext.Provider>,
  );
}

/** Simula o celular (menos de 768px): o menu lateral fica escondido até abrir. */
function simularCelular() {
  window.matchMedia = vi.fn().mockImplementation((consulta: string) => ({
    matches: false,
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as never;
}

describe("menu lateral no celular", () => {
  afterEach(() => {
    // @ts-expect-error: o jsdom não define matchMedia; volta ao estado original.
    delete window.matchMedia;
    vi.restoreAllMocks();
  });

  it("fechado, fica inerte: o teclado não entra nos links escondidos", () => {
    simularCelular();
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    const { container } = comUsuario(
      frota,
      "/",
      <Sidebar aberta={false} aoFechar={() => {}} />,
    );

    expect(container.querySelector("aside")).toHaveAttribute("inert");
  });

  it("aberto, recebe o foco, deixa de ser inerte e Esc fecha", async () => {
    simularCelular();
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);
    const aoFechar = vi.fn();

    const { container } = comUsuario(
      frota,
      "/",
      <Sidebar aberta aoFechar={aoFechar} />,
    );

    expect(container.querySelector("aside")).not.toHaveAttribute("inert");
    expect(screen.getByRole("button", { name: "Fechar menu" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("em tela larga o menu nunca é inerte", () => {
    // Sem matchMedia (jsdom) vale o layout largo.
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    const { container } = comUsuario(
      frota,
      "/",
      <Sidebar aberta={false} aoFechar={() => {}} />,
    );

    expect(container.querySelector("aside")).not.toHaveAttribute("inert");
  });

  it("o botão do menu diz se está aberto e qual elemento controla", () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    comUsuario(frota, "/", <Header aoAbrirMenu={() => {}} menuAberto />);

    const botao = screen.getByRole("button", { name: "Abrir menu" });

    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(botao).toHaveAttribute("aria-controls", "menu-lateral");
  });
});

describe("títulos do Header na frota", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["/agenda", "Agenda"],
    ["/frota/cadastros", "Motoristas e centros"],
    ["/frota/configuracoes", "Gestão da frota"],
    ["/qr/abc123", "QR Code do veículo"],
  ])("%s tem o próprio título, não o do Início", (rota, titulo) => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    comUsuario(frota, rota, <Header aoAbrirMenu={() => {}} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(titulo);
  });

  // Uma tela, um nome: o item do menu e o h1 do cabeçalho dizem a mesma coisa.
  it.each([
    "/",
    "/veiculos",
    "/agenda",
    "/frota/ocorrencias",
    "/frota/cadastros",
    "/frota/configuracoes",
    "/frota/painel",
    "/frota/multas",
    "/frota/financeiro",
    "/frota/relatorios",
    "/frota/checklists",
  ])("%s: o nome no menu é o título do cabeçalho, e o item fica marcado", (rota) => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);
    const administrador: Usuario = { ...frota, papel: "administrador", menus: ["veiculos", "agenda", "cadastros"] };

    comUsuario(
      administrador,
      rota,
      <>
        <Header aoAbrirMenu={() => {}} />
        <Sidebar aberta aoFechar={() => {}} />
      </>,
    );

    const titulos = screen.getAllByRole("heading", { level: 1 });
    expect(titulos).toHaveLength(1);

    const menu = screen.getByRole("navigation", { name: "Principal" });
    const item = within(menu).getAllByRole("link").find((link) => link.getAttribute("href") === rota);

    expect(item).toBeDefined();
    expect(item).toHaveAccessibleName(titulos[0].textContent ?? "");
    expect(item).toHaveAttribute("aria-current", "page");
  });

  it("pessoa: a tela de veículos se chama Meus veículos no menu e no cabeçalho", () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);
    const pessoa: Usuario = { ...frota, perfil: "pessoa" };

    comUsuario(
      pessoa,
      "/veiculos",
      <>
        <Header aoAbrirMenu={() => {}} />
        <Sidebar aberta aoFechar={() => {}} />
      </>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Meus veículos");
    expect(screen.getByRole("link", { name: "Meus veículos" })).toHaveAttribute("aria-current", "page");
  });
});

describe("menu Gestão da frota", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["administrador", true],
    ["gestor", true],
    ["motorista", false],
  ])("papel %s: aparece no menu? %s", (papel, visivel) => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    comUsuario({ ...frota, papel, menus: ["veiculos", "agenda", "cadastros"] }, "/", <Sidebar aberta aoFechar={() => {}} />);

    const link = screen.queryByRole("link", { name: /Gestão da frota/ });

    if (visivel) {
      expect(link).toHaveAttribute("href", "/frota/configuracoes");
    } else {
      expect(link).not.toBeInTheDocument();
    }
  });
});

describe("usuário no rodapé do menu", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("o e-mail longo é cortado com reticências e o title mostra ele inteiro; o nome fica como estava", () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);
    const email = "um.email.bem.comprido.de.gestor@empresa-de-frota.com.br";

    comUsuario({ ...frota, name: "Gestora", email }, "/", <Sidebar aberta aoFechar={() => {}} />);

    const textoDoEmail = screen.getByText(email);
    expect(textoDoEmail).toHaveAttribute("title", email);
    expect(textoDoEmail).toHaveClass("truncate");

    const nome = screen.getByText("Gestora");
    expect(nome).toHaveClass("truncate");
    expect(nome).not.toHaveAttribute("title");
  });

  it("sem e-mail, não sobra um title vazio", () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    const { container } = comUsuario({ ...frota, email: "" }, "/", <Sidebar aberta aoFechar={() => {}} />);

    expect(container.querySelector('aside span.truncate[title=""]')).toBeNull();
  });

  it("nenhum controle do menu tira o contorno de foco", () => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    const { container } = comUsuario(frota, "/", <Sidebar aberta aoFechar={() => {}} />);

    for (const controle of container.querySelectorAll("aside a, aside button")) {
      expect(controle.className).not.toMatch(/outline-none/);
    }
  });
});

describe("telas de senha", () => {
  it("esqueci a senha: o campo é achado pelo rótulo", () => {
    render(
      <MemoryRouter>
        <EsqueciSenha />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
  });

  it("redefinir senha: os dois campos são achados pelo rótulo", () => {
    render(
      <MemoryRouter initialEntries={["/redefinir-senha?token=abc&email=a@b.com"]}>
        <RedefinirSenha />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar nova senha")).toBeInTheDocument();
  });
});
