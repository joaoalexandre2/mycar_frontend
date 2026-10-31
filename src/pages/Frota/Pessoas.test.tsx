import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { centrosCustoService, motoristasService, pessoasFrotaService } from "../../services/frota";
import { Cadastros } from "./Cadastros";
import { Pessoas } from "./Pessoas";
import type { PessoaDaFrota } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const pessoas: PessoaDaFrota[] = [
  { id: 1, name: "Ana Admin", email: "ana@x.com", papel: "administrador" },
  { id: 2, name: "Gil Gestor", email: "gil@x.com", papel: "gestor" },
];

function comUsuario(papel: string, id = 1) {
  const valor = {
    usuario: { id, name: "Ana", email: "ana@x.com", perfil: "frota", papel, permissoes: undefined },
    autenticado: true,
  } as unknown as AuthContextValor;

  return (ui: React.ReactNode) =>
    render(
      <AuthContext.Provider value={valor}>
        <NotificacoesProvider>{ui}</NotificacoesProvider>
      </AuthContext.Provider>,
    );
}

describe("Pessoas e papéis", () => {
  it("lista as pessoas e troca o papel de quem não é a própria pessoa", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(pessoas);
    const mudar = vi.spyOn(pessoasFrotaService, "mudarPapel").mockResolvedValue({ ...pessoas[1], papel: "administrador" });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    expect(await screen.findByText("Gil Gestor")).toBeInTheDocument();
    expect(screen.getByLabelText("Papel de Ana Admin")).toBeDisabled();

    await usuario.selectOptions(screen.getByLabelText("Papel de Gil Gestor"), "administrador");

    await waitFor(() => expect(mudar).toHaveBeenCalledWith(2, "administrador"));
  });

  it("convida uma pessoa nova com o papel escolhido", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(pessoas);
    const convidar = vi.spyOn(pessoasFrotaService, "convidar").mockResolvedValue({
      id: 3, name: "Lia", email: "lia@x.com", papel: "gestor",
    });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    await screen.findByText("Gil Gestor");
    await usuario.type(screen.getByLabelText("Nome"), "Lia");
    await usuario.type(screen.getByLabelText("E-mail"), "lia@x.com");
    await usuario.click(screen.getByRole("button", { name: /Enviar convite/ }));

    await waitFor(() =>
      expect(convidar).toHaveBeenCalledWith({ nome: "Lia", email: "lia@x.com", papel: "gestor" }),
    );
  });

  it("não mostra a aba de pessoas para quem não é administrador", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([]);
    const listar = vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(pessoas);

    comUsuario("gestor")(<Cadastros />);

    expect(await screen.findByRole("tab", { name: /Motoristas/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Pessoas e papéis/ })).not.toBeInTheDocument();
    expect(listar).not.toHaveBeenCalled();
  });

  it("mostra a aba de pessoas para o administrador", async () => {
    vi.spyOn(motoristasService, "listar").mockResolvedValue([]);
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([]);
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(pessoas);
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Cadastros />);

    await usuario.click(await screen.findByRole("tab", { name: /Pessoas e papéis/ }));

    expect(await screen.findByText("Gil Gestor")).toBeInTheDocument();
  });
});
