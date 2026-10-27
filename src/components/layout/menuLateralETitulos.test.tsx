import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
    ["/agenda", "Agenda de veículos"],
    ["/frota/cadastros", "Motoristas e centros de custo"],
  ])("%s tem o próprio título, não o do Início", (rota, titulo) => {
    vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    comUsuario(frota, rota, <Header aoAbrirMenu={() => {}} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(titulo);
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
