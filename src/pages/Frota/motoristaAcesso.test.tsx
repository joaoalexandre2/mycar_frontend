import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import api from "../../services/api";
import { mapearMotorista, motoristasService } from "../../services/frota";
import { Cadastros } from "./Cadastros";
import type { Motorista } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

function motorista(parcial: Partial<Motorista> = {}): Motorista {
  return {
    id: 1,
    nome: "Maria Silva",
    telefone: null,
    cnhNumero: null,
    cnhValidade: null,
    ativo: true,
    centroCustoId: null,
    ...parcial,
  };
}

function cadastros() {
  return render(
    <NotificacoesProvider>
      <Cadastros />
    </NotificacoesProvider>,
  );
}

describe("motoristasService: estado de acesso", () => {
  it("lê o estado e o e-mail do login", () => {
    const m = mapearMotorista({ id: 1, nome: "Ana", ativo: true, acesso: "convite_enviado", acesso_email: "ana@x.com", user_id: 9 });

    expect(m.acesso).toBe("convite_enviado");
    expect(m.acessoEmail).toBe("ana@x.com");
    expect(m.userId).toBe(9);
  });

  it("servidor antigo (sem o campo) ou valor estranho vira desconhecido", () => {
    expect(mapearMotorista({ id: 1, nome: "Ana", ativo: true }).acesso).toBeNull();
    expect(mapearMotorista({ id: 1, nome: "Ana", ativo: true, acesso: "qualquer" }).acesso).toBeNull();
  });

  it("envia o e-mail para a rota de acesso do motorista", async () => {
    const post = vi.spyOn(api, "post").mockResolvedValue({ data: { message: "Convite enviado para ana@x.com." } });

    await expect(motoristasService.enviarAcesso(4, "ana@x.com")).resolves.toEqual({ mensagem: "Convite enviado para ana@x.com." });
    expect(post).toHaveBeenCalledWith("/conta/motoristas/4/acesso", { email: "ana@x.com" });
  });
});

describe("Cadastros: acesso do motorista", () => {
  it("mostra o estado de acesso de cada motorista e o botão certo", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([
      motorista({ id: 1, nome: "Sem Login", acesso: "sem_acesso" }),
      motorista({ id: 2, nome: "Convidada", acesso: "convite_enviado", acessoEmail: "convidada@x.com" }),
      motorista({ id: 3, nome: "Ativa", acesso: "ativo", acessoEmail: "ativa@x.com" }),
    ]);
    cadastros();

    expect(await screen.findByText("Sem acesso ao sistema")).toBeInTheDocument();
    expect(screen.getByText("Convite enviado, ainda não entrou · convidada@x.com")).toBeInTheDocument();
    expect(screen.getByText("Acesso ativo · ativa@x.com")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Enviar acesso para Sem Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reenviar convite para Convidada" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /para Ativa/ })).not.toBeInTheDocument();
  });

  it("sem o campo de acesso (backend antigo), não mostra estado nem botão", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([motorista()]);
    cadastros();

    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enviar acesso|Reenviar convite/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Sem acesso|Convite enviado|Acesso ativo/)).not.toBeInTheDocument();
  });

  it("motorista desativado não recebe convite", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([motorista({ ativo: false, acesso: "sem_acesso" })]);
    cadastros();

    expect(await screen.findByText("Sem acesso ao sistema")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enviar acesso/ })).not.toBeInTheDocument();
  });

  it("pede o e-mail, recusa formato inválido e confirma o envio", async () => {
    const listar = vi
      .spyOn(motoristasService, "listar")
      .mockResolvedValueOnce([motorista({ acesso: "sem_acesso" })])
      .mockResolvedValue([motorista({ acesso: "convite_enviado", acessoEmail: "maria@empresa.com.br" })]);
    const enviar = vi.spyOn(motoristasService, "enviarAcesso").mockResolvedValue({ mensagem: "ok" });
    const usuario = userEvent.setup();
    cadastros();

    const botao = await screen.findByRole("button", { name: "Enviar acesso para Maria Silva" });
    // Alvo de toque de 44px no celular.
    expect(botao.className).toMatch(/(^|\s)h-11(\s|$)/);
    await usuario.click(botao);

    const campo = await screen.findByLabelText("E-mail do motorista");
    await usuario.type(campo, "maria@empresa");
    await usuario.click(screen.getByRole("button", { name: "Enviar convite" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe um e-mail válido");
    expect(enviar).not.toHaveBeenCalled();

    await usuario.clear(campo);
    await usuario.type(campo, "  maria@empresa.com.br ");
    await usuario.click(screen.getByRole("button", { name: "Enviar convite" }));

    await waitFor(() => expect(enviar).toHaveBeenCalledWith(1, "maria@empresa.com.br"));
    expect(await screen.findByRole("status")).toHaveTextContent("Convite enviado para maria@empresa.com.br");
    expect(screen.queryByLabelText("E-mail do motorista")).not.toBeInTheDocument();

    // Recarrega a lista: agora oferece reenviar.
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("button", { name: "Reenviar convite para Maria Silva" })).toBeInTheDocument();
  });

  it("reenviar usa o e-mail do login já criado", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([
      motorista({ acesso: "convite_enviado", acessoEmail: "maria@empresa.com.br" }),
    ]);
    const enviar = vi.spyOn(motoristasService, "enviarAcesso").mockResolvedValue({ mensagem: "ok" });
    const usuario = userEvent.setup();
    cadastros();

    await usuario.click(await screen.findByRole("button", { name: "Reenviar convite para Maria Silva" }));

    const campo = await screen.findByLabelText("E-mail do motorista");
    expect(campo).toHaveValue("maria@empresa.com.br");
    expect(campo).toHaveAttribute("readonly");

    const modal = campo.closest("form") as HTMLFormElement;
    await usuario.click(within(modal).getByRole("button", { name: "Reenviar convite" }));

    await waitFor(() => expect(enviar).toHaveBeenCalledWith(1, "maria@empresa.com.br"));
  });

  it("mostra a recusa do servidor e mantém o formulário aberto", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([motorista({ acesso: "sem_acesso" })]);
    vi.spyOn(motoristasService, "enviarAcesso").mockRejectedValue(
      Object.assign(new Error("422"), {
        isAxiosError: true,
        response: { status: 422, data: { message: "Já existe um usuário com este e-mail." } },
      }),
    );
    const usuario = userEvent.setup();
    cadastros();

    await usuario.click(await screen.findByRole("button", { name: "Enviar acesso para Maria Silva" }));
    await usuario.type(await screen.findByLabelText("E-mail do motorista"), "maria@empresa.com.br");
    await usuario.click(screen.getByRole("button", { name: "Enviar convite" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe um usuário com este e-mail.");
    expect(screen.getByLabelText("E-mail do motorista")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
