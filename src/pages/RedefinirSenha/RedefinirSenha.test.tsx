import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RedefinirSenha } from "./RedefinirSenha";
import { authService } from "../../services/auth";

const mockNavigate = vi.fn();

// Mantém o MemoryRouter real (a tela lê a query) e só espia o navigate.
vi.mock("react-router-dom", async () => {
  const original = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return { ...original, useNavigate: () => mockNavigate };
});

const REDEFINIR = "/redefinir-senha?token=abc&email=ana%40exemplo.com";
const CONVITE = `${REDEFINIR}&convite=1`;

function abrir(rota: string) {
  render(
    <MemoryRouter initialEntries={[rota]}>
      <RedefinirSenha />
    </MemoryRouter>,
  );
}

describe("RedefinirSenha", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockNavigate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function usuario() {
    return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  }

  describe("sem o marcador de convite (esqueci minha senha)", () => {
    it("mostra a tela de redefinição de sempre", () => {
      abrir(REDEFINIR);

      expect(screen.getByRole("heading", { name: "Redefinir senha" })).toBeInTheDocument();
      expect(screen.getByText("Escolha uma nova senha para ana@exemplo.com.")).toBeInTheDocument();
      expect(screen.getByLabelText("Nova senha")).toHaveFocus();
      expect(screen.getByLabelText("Confirmar nova senha")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Redefinir senha" })).toBeInTheDocument();
      expect(screen.queryByText(/crie sua senha/i)).not.toBeInTheDocument();
    });

    it("convite com outro valor não troca os textos", () => {
      abrir(`${REDEFINIR}&convite=0`);

      expect(screen.getByRole("heading", { name: "Redefinir senha" })).toBeInTheDocument();
    });

    it("envia, avisa e leva ao login", async () => {
      const redefinir = vi.spyOn(authService, "redefinirSenha").mockResolvedValue();
      abrir(REDEFINIR);
      const u = usuario();

      await u.type(screen.getByLabelText("Nova senha"), "senha-forte-123");
      await u.type(screen.getByLabelText("Confirmar nova senha"), "senha-forte-123");
      await u.click(screen.getByRole("button", { name: "Redefinir senha" }));

      expect(redefinir).toHaveBeenCalledWith({
        token: "abc",
        email: "ana@exemplo.com",
        password: "senha-forte-123",
        password_confirmation: "senha-forte-123",
      });
      expect(await screen.findByRole("status")).toHaveTextContent("Senha redefinida! Levando você para o login...");

      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
    });
  });

  describe("com convite=1 (primeiro acesso)", () => {
    it("fala em criar a senha", () => {
      abrir(CONVITE);

      expect(screen.getByRole("heading", { name: "Crie sua senha" })).toBeInTheDocument();
      expect(screen.getByText(/Você foi convidado para o MyCar/)).toHaveTextContent("ana@exemplo.com");
      expect(screen.getByLabelText("Senha")).toHaveFocus();
      expect(screen.getByLabelText("Confirmar senha")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Criar senha" })).toBeInTheDocument();
      expect(screen.queryByText(/redefini/i)).not.toBeInTheDocument();
    });

    it("mantém a validação da confirmação sem chamar o servidor", async () => {
      const redefinir = vi.spyOn(authService, "redefinirSenha").mockResolvedValue();
      abrir(CONVITE);
      const u = usuario();

      expect(screen.getByLabelText("Senha")).toBeRequired();
      expect(screen.getByLabelText("Senha")).toHaveAttribute("minLength", "8");

      await u.type(screen.getByLabelText("Senha"), "senha-forte-123");
      await u.type(screen.getByLabelText("Confirmar senha"), "outra-senha-456");
      await u.click(screen.getByRole("button", { name: "Criar senha" }));

      expect(screen.getByRole("alert")).toHaveTextContent("A confirmação de senha não é igual à senha.");
      expect(redefinir).not.toHaveBeenCalled();
    });

    it("mostra o erro do servidor", async () => {
      vi.spyOn(authService, "redefinirSenha").mockRejectedValue(new Error("Este link expirou."));
      abrir(CONVITE);
      const u = usuario();

      await u.type(screen.getByLabelText("Senha"), "senha-forte-123");
      await u.type(screen.getByLabelText("Confirmar senha"), "senha-forte-123");
      await u.click(screen.getByRole("button", { name: "Criar senha" }));

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("cria a senha, avisa e leva ao login como antes", async () => {
      const redefinir = vi.spyOn(authService, "redefinirSenha").mockResolvedValue();
      abrir(CONVITE);
      const u = usuario();

      await u.type(screen.getByLabelText("Senha"), "senha-forte-123");
      await u.type(screen.getByLabelText("Confirmar senha"), "senha-forte-123");
      await u.click(screen.getByRole("button", { name: "Criar senha" }));

      // O marcador não vai para o servidor: o endpoint é o mesmo da redefinição.
      expect(redefinir).toHaveBeenCalledWith({
        token: "abc",
        email: "ana@exemplo.com",
        password: "senha-forte-123",
        password_confirmation: "senha-forte-123",
      });
      expect(await screen.findByRole("status")).toHaveTextContent("Senha criada! Levando você para o login...");

      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
    });

    it("link incompleto continua oferecendo um novo link", () => {
      abrir("/redefinir-senha?convite=1&email=ana%40exemplo.com");

      expect(screen.getByText(/Este link está incompleto ou inválido/)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Solicitar novo link" })).toHaveAttribute("href", "/esqueci-senha");
    });
  });
});
