import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { centrosCustoService, motivosTrocaCentroService, usosService } from "../../services/frota";
import { TrocarCentroModal } from "./TrocarCentroModal";
import type { CentroCusto, TrocaDeCentro, UsoVeiculo } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

const vendas: CentroCusto = { id: 1, nome: "Vendas", codigo: null, ativo: true };
const entregas: CentroCusto = { id: 2, nome: "Entregas", codigo: null, ativo: true };
const uso = { id: 7, centroCustoId: 1, centroCusto: "Vendas" } as UsoVeiculo;

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

function abrir(papel?: "gestor" | "motorista") {
  const modal = (
    <MemoryRouter initialEntries={["/agenda"]}>
      <NotificacoesProvider>
        <Routes>
          <Route path="/agenda" element={<TrocarCentroModal uso={uso} onTrocado={() => {}} onClose={() => {}} />} />
          <Route path="/frota/configuracoes" element={<p>Tela de motivos</p>} />
        </Routes>
      </NotificacoesProvider>
    </MemoryRouter>
  );

  if (!papel) return render(modal);

  const valor = {
    usuario: { id: 1, name: "Ana", email: "ana@x.com", perfil: "frota", papel, permissoes: ["centros_custo", "usos_corrigir"] },
    autenticado: true,
  } as unknown as AuthContextValor;

  return render(<AuthContext.Provider value={valor}>{modal}</AuthContext.Provider>);
}

describe("Trocar centro: sem motivos cadastrados", () => {
  it("desabilita a troca, explica e leva à tela de motivos", async () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas, entregas]);
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([]);
    vi.spyOn(usosService, "historicoDeCentros").mockResolvedValue([]);
    const usuario = userEvent.setup();
    abrir("gestor");

    const aviso = await screen.findByText(/ainda não tem nenhum cadastrado/);
    const caixa = aviso.closest("[data-tom]") as HTMLElement;
    const botao = screen.getByRole("button", { name: "Trocar centro" });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute("aria-describedby", caixa.id);

    await usuario.click(within(caixa).getByRole("link", { name: "Ir para Motivos de troca" }));

    expect(await screen.findByText("Tela de motivos")).toBeInTheDocument();
  });

  it("quem não chega à Gestão da frota recebe a quem pedir, sem link", async () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas, entregas]);
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([]);
    vi.spyOn(usosService, "historicoDeCentros").mockResolvedValue([]);
    abrir("motorista");

    expect(await screen.findByText(/Peça a um administrador ou gestor/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ir para Motivos de troca" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trocar centro" })).toBeDisabled();
  });

  it("enquanto os motivos carregam, não acusa a falta deles", () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas, entregas]);
    vi.spyOn(motivosTrocaCentroService, "listar").mockReturnValue(new Promise(() => {}));
    vi.spyOn(usosService, "historicoDeCentros").mockResolvedValue([]);
    abrir();

    expect(screen.queryByText(/ainda não tem nenhum cadastrado/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trocar centro" })).toBeEnabled();
  });
});

describe("Trocar centro: resumo e histórico", () => {
  it("mostra de qual centro para qual antes de confirmar", async () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas, entregas]);
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([{ id: 5, nome: "Reclassificação", ativo: true }]);
    vi.spyOn(usosService, "historicoDeCentros").mockResolvedValue([]);
    const usuario = userEvent.setup();
    abrir();

    await screen.findByRole("option", { name: "Entregas" });
    expect(screen.queryByText(/Centro de custo: de/)).not.toBeInTheDocument();

    await usuario.selectOptions(screen.getByLabelText("Novo centro de custo"), "2");

    expect(screen.getByText(/Centro de custo: de/)).toHaveTextContent("Centro de custo: de Vendas para Entregas");
  });

  it("falha ao carregar os motivos: erro próprio com 'Tentar de novo', não o genérico", async () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas, entregas]);
    vi.spyOn(usosService, "historicoDeCentros").mockResolvedValue([]);
    const motivos = vi
      .spyOn(motivosTrocaCentroService, "listar")
      .mockRejectedValueOnce(new Error("rede fora"))
      .mockResolvedValueOnce([{ id: 5, nome: "Reclassificação", ativo: true }]);
    const usuario = userEvent.setup();
    abrir();

    const aviso = await screen.findByText(/Não foi possível carregar os motivos de troca/);
    const caixa = aviso.closest("[data-tom]") as HTMLElement;
    expect(caixa).toHaveAttribute("data-tom", "danger");
    // Sem a lista ainda não se sabe se há motivos: não acusa "nenhum cadastrado".
    expect(screen.queryByText(/ainda não tem nenhum cadastrado/)).not.toBeInTheDocument();

    await usuario.click(within(caixa).getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByRole("option", { name: "Reclassificação" })).toBeInTheDocument();
    expect(screen.queryByText(/Não foi possível carregar os motivos de troca/)).not.toBeInTheDocument();
    expect(motivos).toHaveBeenCalledTimes(2);
  });

  it("falha ao carregar o histórico avisa e tenta de novo", async () => {
    vi.spyOn(centrosCustoService, "listar").mockResolvedValue([vendas, entregas]);
    vi.spyOn(motivosTrocaCentroService, "listar").mockResolvedValue([{ id: 5, nome: "Reclassificação", ativo: true }]);
    const historico = vi
      .spyOn(usosService, "historicoDeCentros")
      .mockRejectedValueOnce(new Error("rede fora"))
      .mockResolvedValueOnce([troca]);
    const usuario = userEvent.setup();
    abrir();

    const aviso = await screen.findByText(/Não foi possível carregar as trocas anteriores/);
    await usuario.click(within(aviso.closest("[data-tom]") as HTMLElement).getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByText(/por Ana Admin/)).toBeInTheDocument();
    expect(screen.queryByText(/Não foi possível carregar as trocas anteriores/)).not.toBeInTheDocument();
    await waitFor(() => expect(historico).toHaveBeenCalledTimes(2));
  });
});
