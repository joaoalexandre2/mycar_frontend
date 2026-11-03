import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContext, type AuthContextValor } from "../../contexts/authContextDefinition";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { contaService } from "../../services/conta/veiculos";
import { ocorrenciasService } from "../../services/ocorrencias";
import type { Ocorrencia, ResumoDeOcorrencias } from "../../types/ocorrencias";
import { Ocorrencias } from "./Ocorrencias";

afterEach(() => vi.restoreAllMocks());

const ocorrencia: Ocorrencia = {
  id: 7,
  tipo: "avaria",
  tipoRotulo: "Avaria",
  status: "aberta",
  statusRotulo: "Aberta",
  dataHora: "2026-11-09T08:00:00-03:00",
  local: "Pátio",
  descricao: "Retrovisor quebrado",
  veiculo: { id: 1, placa: "AAA1A11" },
  motorista: { id: 2, nome: "João" },
  fotos: [],
  prejuizoEstimado: 500,
  valorGasto: null,
  despesaId: null,
};

const resumo: ResumoDeOcorrencias = {
  total: 1,
  abertas: 1,
  porStatus: { aberta: 1, em_analise: 0, aguardando_orcamento: 0, em_reparo: 0, concluida: 0, cancelada: 0 },
  prejuizoTotal: 500,
  gastoTotal: 0,
};

function renderizar(papel: string) {
  const valor = {
    usuario: { id: 1, name: "Ana", email: "ana@x.com", perfil: "frota", papel },
    autenticado: true,
  } as unknown as AuthContextValor;

  return render(
    <AuthContext.Provider value={valor}>
      <NotificacoesProvider>
        <Ocorrencias />
      </NotificacoesProvider>
    </AuthContext.Provider>,
  );
}

function prepararServicos() {
  vi.spyOn(ocorrenciasService, "listar").mockResolvedValue({ dados: [ocorrencia], paginaAtual: 1, totalPaginas: 1, totalRegistros: 1, resumo });
  vi.spyOn(contaService, "listarVeiculos").mockResolvedValue({ dados: [{ id: 1, placa: "AAA1A11", marca: "Fiat", modelo: "Strada" }], paginaAtual: 1, totalPaginas: 1, totalRegistros: 1 } as never);
}

describe("Ocorrências da frota", () => {
  it("gestor vê a ocorrência, o prejuízo estimado e a coluna de gasto", async () => {
    prepararServicos();

    renderizar("gestor");

    expect(await screen.findByText("Retrovisor quebrado")).toBeInTheDocument();
    expect(screen.getByText("Prejuízo estimado")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Gasto" })).toBeInTheDocument();
  });

  it("motorista não vê valores", async () => {
    prepararServicos();

    renderizar("motorista");

    expect(await screen.findByText("Retrovisor quebrado")).toBeInTheDocument();
    expect(screen.queryByText("Prejuízo estimado")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Gasto" })).not.toBeInTheDocument();
  });

  it("registra uma ocorrência com o horário digitado", async () => {
    prepararServicos();
    const criar = vi.spyOn(ocorrenciasService, "criar").mockResolvedValue(ocorrencia);
    const user = userEvent.setup();

    renderizar("motorista");

    await user.click(await screen.findByRole("button", { name: /Registrar ocorrência/ }));
    // Os filtros da lista têm os mesmos rótulos; o formulário é o último deles no documento.
    const ultimo = (rotuloDoCampo: string) => screen.getAllByLabelText(rotuloDoCampo).at(-1) as HTMLElement;
    await user.selectOptions(ultimo("Veículo"), "1");
    await user.selectOptions(ultimo("Tipo"), "acidente");
    fireEvent.change(screen.getByLabelText("Data e hora"), { target: { value: "2026-11-09T08:00" } });
    await user.type(screen.getByLabelText("O que aconteceu"), "Batida leve na traseira");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(criar).toHaveBeenCalledWith(
        expect.objectContaining({ veiculoId: 1, tipo: "acidente", dataHora: "2026-11-09T08:00", descricao: "Batida leve na traseira" }),
      ),
    );
  });
});
