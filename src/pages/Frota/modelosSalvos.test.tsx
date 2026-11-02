import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { gruposUsuariosService, modelosGrupoService } from "../../services/frota";
import { Grupos } from "./Grupos";
import type { GruposDaFrota, ModeloSalvo } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const dados: GruposDaFrota = {
  grupos: [],
  catalogo: { centros_custo: "Cadastrar e mudar os centros de custo", grupos: "Dar acesso a outras pessoas (criar grupos)" },
  menus: { cadastros: "Motoristas e centros", veiculos: "Veículos da frota" },
  usuarios: [],
};

const recepcao: ModeloSalvo = {
  id: 7,
  nome: "Recepção",
  descricao: null,
  permissoes: ["centros_custo"],
  menus_liberados: ["cadastros"],
};

function tela() {
  return render(
    <NotificacoesProvider>
      <Grupos />
    </NotificacoesProvider>,
  );
}

describe("modelos salvos pela frota", () => {
  it("mostra o modelo salvo na lista e no seletor, e aplica ao escolhê-lo", async () => {
    vi.spyOn(gruposUsuariosService, "listar").mockResolvedValue(dados);
    vi.spyOn(modelosGrupoService, "listar").mockResolvedValue([recepcao]);
    const usuario = userEvent.setup();

    tela();

    expect(await screen.findByText("Modelos salvos pela frota")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: /Novo grupo/ }));
    await usuario.selectOptions(screen.getByLabelText("Começar de um modelo (opcional)"), "salvo:7");

    expect(screen.getByLabelText("Cadastrar e mudar os centros de custo")).toBeChecked();
    expect(screen.getByLabelText("Motoristas e centros")).toBeChecked();
  });

  it("salva as permissões atuais como modelo", async () => {
    vi.spyOn(gruposUsuariosService, "listar").mockResolvedValue(dados);
    vi.spyOn(modelosGrupoService, "listar").mockResolvedValue([]);
    const criar = vi.spyOn(modelosGrupoService, "criar").mockResolvedValue({ ...recepcao, id: 8, nome: "Caixa" });
    const usuario = userEvent.setup();

    tela();

    await usuario.click(await screen.findByRole("button", { name: /Novo grupo/ }));
    await usuario.click(screen.getByLabelText("Cadastrar e mudar os centros de custo"));
    await usuario.type(screen.getByLabelText("Nome do modelo"), "Caixa");
    await usuario.click(screen.getByRole("button", { name: "Salvar modelo" }));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith({
        nome: "Caixa",
        permissoes: ["centros_custo"],
        menus_liberados: ["cadastros"],
      }),
    );
  });

  it("remove um modelo salvo depois de confirmar", async () => {
    vi.spyOn(gruposUsuariosService, "listar").mockResolvedValue(dados);
    vi.spyOn(modelosGrupoService, "listar").mockResolvedValue([recepcao]);
    const remover = vi.spyOn(modelosGrupoService, "remover").mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    tela();

    await usuario.click(await screen.findByRole("button", { name: "Remover o modelo Recepção" }));
    await usuario.click(await screen.findByRole("button", { name: "Remover" }));

    await waitFor(() => expect(remover).toHaveBeenCalledWith(7));
  });
});
