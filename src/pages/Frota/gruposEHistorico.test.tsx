import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { TrocarCentroModal } from "../../components/frota/TrocarCentroModal";
import { centrosCustoService, gruposUsuariosService, motivosTrocaCentroService, usosService } from "../../services/frota";
import { Cadastros } from "./Cadastros";
import { Grupos } from "./Grupos";
import { HistoricoCentros } from "./HistoricoCentros";
import type { CentroCusto, GruposDaFrota, TrocaDeCentro, UsoVeiculo } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const vendas: CentroCusto = { id: 1, nome: "Vendas", codigo: null, ativo: true };
const entregas: CentroCusto = { id: 2, nome: "Entregas", codigo: null, ativo: true };

const troca: TrocaDeCentro = {
  id: 9,
  usoId: 7,
  veiculoId: 3,
  de: { id: 1, nome: "Vendas" },
  para: { id: 2, nome: "Entregas" },
  usuario: "Ana Admin",
  motivo: "Lançado errado pelo motorista",
  em: "2026-11-10T10:00:00-03:00",
};

const dadosDosGrupos: GruposDaFrota = {
  grupos: [
    {
      id: 1,
      nome: "Apoio",
      descricao: "Time de apoio",
      permissoes: ["centros_custo"],
      menus_liberados: [],
      membros: [{ id: 10, name: "Bia", email: "bia@x.com" }],
    },
  ],
  catalogo: { centros_custo: "Gerenciar centros de custo", grupos: "Gerenciar grupos de usuários" },
  menus: { veiculos: "Veículos da frota", agenda: "Agenda", cadastros: "Motoristas e centros" },
  usuarios: [
    { id: 10, name: "Bia", email: "bia@x.com" },
    { id: 11, name: "Caio", email: "caio@x.com" },
  ],
};

function comProvedores(ui: React.ReactNode) {
  return render(<NotificacoesProvider>{ui}</NotificacoesProvider>);
}

describe("Grupos de usuários", () => {
  it("lista os grupos com permissões e membros", async () => {
    vi.spyOn(gruposUsuariosService, "listar").mockResolvedValue(dadosDosGrupos);

    comProvedores(<Grupos />);

    expect(await screen.findByText("Apoio")).toBeInTheDocument();
    expect(screen.getByText("Gerenciar centros de custo")).toBeInTheDocument();
    expect(screen.getByText(/1 membro: Bia/)).toBeInTheDocument();
  });

  it("cria um grupo com permissões e membros escolhidos", async () => {
    vi.spyOn(gruposUsuariosService, "listar").mockResolvedValue({ ...dadosDosGrupos, grupos: [] });
    const criar = vi.spyOn(gruposUsuariosService, "criar").mockResolvedValue(dadosDosGrupos.grupos[0]);
    const usuario = userEvent.setup();

    comProvedores(<Grupos />);

    await usuario.click(await screen.findByRole("button", { name: /Novo grupo/ }));
    await usuario.type(screen.getByLabelText("Nome"), "Vendas SP");
    await usuario.click(screen.getByLabelText("Gerenciar centros de custo"));
    await usuario.click(screen.getByLabelText(/Caio/));
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith({
        nome: "Vendas SP",
        descricao: null,
        permissoes: ["centros_custo"],
        menus_liberados: [],
        membros: [11],
      }),
    );
  });

  it("escolhe os menus que o grupo libera", async () => {
    vi.spyOn(gruposUsuariosService, "listar").mockResolvedValue({ ...dadosDosGrupos, grupos: [] });
    const criar = vi.spyOn(gruposUsuariosService, "criar").mockResolvedValue(dadosDosGrupos.grupos[0]);
    const usuario = userEvent.setup();

    comProvedores(<Grupos />);

    await usuario.click(await screen.findByRole("button", { name: /Novo grupo/ }));
    await usuario.type(screen.getByLabelText("Nome"), "Sem cadastros");
    await usuario.click(screen.getByLabelText("Motoristas e centros"));
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith(expect.objectContaining({ menus_liberados: ["cadastros"] })),
    );
  });

  it("não envia grupo sem nome", async () => {
    vi.spyOn(gruposUsuariosService, "listar").mockResolvedValue(dadosDosGrupos);
    const criar = vi.spyOn(gruposUsuariosService, "criar");
    const usuario = userEvent.setup();

    comProvedores(<Grupos />);

    await usuario.click(await screen.findByRole("button", { name: /Novo grupo/ }));
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe o nome do grupo.");
    expect(criar).not.toHaveBeenCalled();
  });
});

describe("Histórico de centros de custo", () => {
  it("mostra de qual centro para qual, quem trocou e o motivo", async () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas, entregas]);
    vi.spyOn(centrosCustoService, "trocas").mockResolvedValue([troca]);

    comProvedores(<HistoricoCentros />);

    expect(await screen.findByText(/por Ana Admin/)).toBeInTheDocument();
    expect(screen.getByText("Lançado errado pelo motorista", { exact: false })).toBeInTheDocument();
  });

  it("filtra por centro de custo", async () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas, entregas]);
    const trocas = vi.spyOn(centrosCustoService, "trocas").mockResolvedValue([]);
    const usuario = userEvent.setup();

    comProvedores(<HistoricoCentros />);

    expect(await screen.findByText(/Nenhuma troca/)).toBeInTheDocument();
    await screen.findByRole("option", { name: "Vendas" });
    await usuario.selectOptions(screen.getByLabelText("Centro de custo"), "1");

    await waitFor(() => expect(trocas).toHaveBeenLastCalledWith({ de: "", ate: "", centroCustoId: 1 }));
  });
});

describe("Trocar centro de custo de um uso", () => {
  const uso = {
    id: 7,
    centroCustoId: 1,
    centroCusto: "Vendas",
  } as UsoVeiculo;

  it("exige o motivo escolhido na lista e envia a troca", async () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas, entregas]);
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([
      { id: 5, nome: "Reclassificação mensal", ativo: true },
    ]);
    vi.spyOn(usosService, "historicoDeCentros").mockResolvedValue([troca]);
    const trocar = vi.spyOn(usosService, "trocarCentro").mockResolvedValue({ ...uso, centroCustoId: 2, centroCusto: "Entregas" });
    const onTrocado = vi.fn();
    const usuario = userEvent.setup();

    comProvedores(<TrocarCentroModal uso={uso} onTrocado={onTrocado} onClose={() => {}} />);

    // O centro atual não é oferecido como destino; o histórico anterior aparece.
    await screen.findByRole("option", { name: "Entregas" });
    expect(screen.queryByRole("option", { name: "Vendas" })).not.toBeInTheDocument();
    expect(await screen.findByText(/por Ana Admin/)).toBeInTheDocument();

    await usuario.selectOptions(screen.getByLabelText("Novo centro de custo"), "2");
    await usuario.click(screen.getByRole("button", { name: "Trocar centro" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("motivo");
    expect(trocar).not.toHaveBeenCalled();

    await usuario.selectOptions(screen.getByLabelText("Motivo"), "5");
    await usuario.click(screen.getByRole("button", { name: "Trocar centro" }));

    await waitFor(() => expect(trocar).toHaveBeenCalledWith(7, 2, 5));
    expect(onTrocado).toHaveBeenCalled();
  });
});

describe("Abas do cadastro da frota", () => {
  function comPermissoes(permissoes: string[]) {
    const valor = {
      usuario: { id: 1, name: "Ana", email: "ana@x.com", perfil: "frota", permissoes },
      autenticado: true,
    } as unknown as AuthContextValor;

    return render(
      <AuthContext.Provider value={valor}>
        <NotificacoesProvider>
          <Cadastros />
        </NotificacoesProvider>
      </AuthContext.Provider>,
    );
  }

  it("mostra só as abas que a pessoa pode usar", async () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([]);

    comPermissoes(["centros_custo"]);

    expect(await screen.findByRole("tab", { name: /Centros de custo/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Histórico de centros/ })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Grupos de usuários/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Motoristas/ })).not.toBeInTheDocument();
  });

  it("mostra o aviso quando o menu Motoristas e centros não está liberado", async () => {
    const valor = {
      usuario: { id: 1, name: "Ana", email: "ana@x.com", perfil: "frota", permissoes: ["motoristas", "centros_custo"], menus: ["veiculos", "agenda"] },
      autenticado: true,
    } as unknown as AuthContextValor;

    render(
      <AuthContext.Provider value={valor}>
        <NotificacoesProvider>
          <Cadastros />
        </NotificacoesProvider>
      </AuthContext.Provider>,
    );

    expect(screen.getByText(/não está liberada para o seu acesso na frota/)).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("abre na primeira aba permitida quando falta permissão para Motoristas", async () => {
    vi.spyOn(gruposUsuariosService, "listar").mockResolvedValue(dadosDosGrupos);

    comPermissoes(["grupos"]);

    expect(await screen.findByText("Apoio")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Grupos de usuários/ })).toHaveAttribute("aria-selected", "true");
  });
});
