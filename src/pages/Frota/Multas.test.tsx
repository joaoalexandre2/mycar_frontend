import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { multasService } from "../../services/frotaDiferenciais";
import type { Multa } from "../../types/frota";
import { Multas } from "./Multas";

afterEach(() => vi.restoreAllMocks());

function multa(numero: number): Multa {
  return {
    id: numero,
    data_hora: "2026-10-20T14:00:00-03:00",
    descricao: `Infração ${numero}`,
    valor: "130.16",
    pontos: 4,
    situacao: "aberta",
    observacoes: null,
    veiculo: { id: 1, placa: "AAA1A11", nome: "Fiat Strada" },
    uso_veiculo_id: null,
    motorista: { id: 2, nome: "Maria" },
  };
}

function renderizar() {
  return render(
    <NotificacoesProvider>
      <Multas />
    </NotificacoesProvider>,
  );
}

describe("Multas da frota", () => {
  it("anda pelas páginas da lista e volta à primeira ao trocar a situação", async () => {
    const user = userEvent.setup();
    const listar = vi.spyOn(multasService, "listar").mockImplementation(async (filtro = {}) => {
      const pagina = filtro.pagina ?? 1;

      return { dados: [multa(pagina)], paginaAtual: pagina, totalPaginas: 2, totalRegistros: 2 };
    });

    renderizar();

    expect(await screen.findByText("Infração 1")).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Próxima/ }));

    expect(await screen.findByText("Infração 2")).toBeInTheDocument();
    expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Próxima/ })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText("Filtrar por situação"), "paga");

    await waitFor(() => expect(listar).toHaveBeenLastCalledWith({ situacao: "paga", pagina: 1 }));
    expect(await screen.findByText("Infração 1")).toBeInTheDocument();
  });

  it("volta para a última página com multas quando a página atual fica vazia", async () => {
    const user = userEvent.setup();
    const listar = vi.spyOn(multasService, "listar").mockImplementation(async (filtro = {}) => {
      if (filtro.pagina === 2) {
        return { dados: [], paginaAtual: 2, totalPaginas: 1, totalRegistros: 1 };
      }

      return { dados: [multa(1)], paginaAtual: 1, totalPaginas: 2, totalRegistros: 2 };
    });

    renderizar();

    await user.click(await screen.findByRole("button", { name: /Próxima/ }));

    await waitFor(() => expect(listar).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 1 })));
    expect(listar).toHaveBeenCalledTimes(3);
    expect(await screen.findByText("Infração 1")).toBeInTheDocument();
  });
});
