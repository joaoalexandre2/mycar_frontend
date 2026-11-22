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

  it("mostra quem ligou uma pessoa a um cadastro de motorista", async () => {
    vi.spyOn(pessoasFrotaService, "acessos").mockResolvedValue([
      {
        id: 2,
        quando: "2026-11-02T10:00:00Z",
        ator: "Ana Admin",
        alvo_tipo: "pessoa",
        alvo_id: 3,
        acao: "ligou_motorista",
        detalhes: { nome: "Rui Rua", motorista_id: 9, motorista: "Rui Rua", criou_cadastro: true },
      },
    ]);

    render(<AcessosHistorico />);

    expect(await screen.findByText(/ligou a um cadastro de motorista/)).toBeInTheDocument();
    expect(screen.getByText("Rui Rua → Rui Rua (cadastro criado)")).toBeInTheDocument();
  });

  it("avisa quando ainda não há mudanças", async () => {
    vi.spyOn(pessoasFrotaService, "acessos").mockResolvedValue([]);

    render(<AcessosHistorico />);

    expect(await screen.findByText(/Nenhuma mudança de acesso registrada/)).toBeInTheDocument();
  });
});
