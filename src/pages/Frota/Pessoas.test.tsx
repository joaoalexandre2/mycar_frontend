import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { motivosTrocaCentroService, pessoasFrotaService } from "../../services/frota";
import { ConfiguracoesFrota } from "./ConfiguracoesFrota";
import { Pessoas } from "./Pessoas";
import type { PessoaDaFrota } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const pessoas: PessoaDaFrota[] = [
  { id: 1, name: "Ana Admin", email: "ana@x.com", papel: "administrador", permissoes: [], menus: [] },
  { id: 2, name: "Gil Gestor", email: "gil@x.com", papel: "gestor", permissoes: [], menus: [] },
];

/** A resposta de GET /conta/pessoas: pessoas e os textos do catálogo, numa resposta só. */
const lista = { pessoas, catalogo: {}, menus: {} };

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
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(lista);
    const mudar = vi.spyOn(pessoasFrotaService, "mudarPapel").mockResolvedValue({ ...pessoas[1], papel: "administrador" });
    const usuario = userEvent.setup();

    comUsuario("administrador")(<Pessoas />);

    expect(await screen.findByText("Gil Gestor")).toBeInTheDocument();
    expect(screen.getByLabelText("Papel de Ana Admin")).toBeDisabled();

    await usuario.selectOptions(screen.getByLabelText("Papel de Gil Gestor"), "administrador");

    await waitFor(() => expect(mudar).toHaveBeenCalledWith(2, "administrador"));
  });

  it("convida uma pessoa nova com o papel escolhido", async () => {
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(lista);
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
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([]);
    const listar = vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(lista);

    comUsuario("gestor")(<ConfiguracoesFrota />);

    expect(await screen.findByRole("tab", { name: /Motivos de troca/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Pessoas e papéis/ })).not.toBeInTheDocument();
    expect(listar).not.toHaveBeenCalled();
  });

  it("mostra a aba de pessoas para o administrador", async () => {
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([]);
    vi.spyOn(pessoasFrotaService, "listar").mockResolvedValue(lista);
    const usuario = userEvent.setup();

    comUsuario("administrador")(<ConfiguracoesFrota />);

    await usuario.click(await screen.findByRole("tab", { name: /Pessoas e papéis/ }));

    expect(await screen.findByText("Gil Gestor")).toBeInTheDocument();
  });
});
