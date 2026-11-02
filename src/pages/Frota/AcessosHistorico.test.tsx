import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { pessoasFrotaService } from "../../services/frota";
import { AcessosHistorico } from "./AcessosHistorico";
import type { EventoDeAcesso } from "../../types/frota";

afterEach(() => vi.restoreAllMocks());

describe("Histórico de acessos", () => {
  it("mostra quem mudou o papel de quem, com o papel antes e depois", async () => {
    const eventos: EventoDeAcesso[] = [
      {
        id: 1,
        quando: "2026-11-02T10:00:00Z",
        ator: "Ana Admin",
        alvo_tipo: "pessoa",
        alvo_id: 2,
        acao: "mudou_papel",
        detalhes: { nome: "Gil Gestor", de: "gestor", para: "administrador" },
      },
    ];
    vi.spyOn(pessoasFrotaService, "acessos").mockResolvedValue(eventos);

    render(<AcessosHistorico />);

    expect(await screen.findByText(/Ana Admin/)).toBeInTheDocument();
    expect(screen.getByText(/mudou o papel de/)).toBeInTheDocument();
    expect(screen.getByText("Gil Gestor: gestor → administrador")).toBeInTheDocument();
  });

  it("avisa quando ainda não há mudanças", async () => {
    vi.spyOn(pessoasFrotaService, "acessos").mockResolvedValue([]);

    render(<AcessosHistorico />);

    expect(await screen.findByText(/Nenhuma mudança de acesso registrada/)).toBeInTheDocument();
  });
});
