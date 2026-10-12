import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useCarregarLista } from "./useCarregarLista";

function adiavel() {
  let concluir!: () => void;
  const promessa = new Promise<void>((resolve) => {
    concluir = resolve;
  });

  return { promessa, concluir };
}

describe("useCarregarLista", () => {
  it("fica carregando até a carga terminar", async () => {
    const carga = adiavel();
    const carregar = vi.fn(() => carga.promessa);

    const { result } = renderHook(() => useCarregarLista("1", carregar));

    expect(result.current.carregando).toBe(true);

    await act(async () => carga.concluir());

    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(carregar).toHaveBeenCalledTimes(1);
  });

  it("carrega de novo quando a chave muda e marca a resposta antiga como inativa", async () => {
    const ativos: Array<() => boolean> = [];
    const carregar = vi.fn((ativo: () => boolean) => {
      ativos.push(ativo);
      return Promise.resolve();
    });

    const { result, rerender } = renderHook(
      ({ chave }) => useCarregarLista(chave, carregar),
      { initialProps: { chave: "pagina-1" } },
    );

    await waitFor(() => expect(result.current.carregando).toBe(false));

    rerender({ chave: "pagina-2" });

    await waitFor(() => expect(carregar).toHaveBeenCalledTimes(2));
    expect(ativos[0]()).toBe(false);
    expect(ativos[1]()).toBe(true);
  });

  it("não deixa a resposta antiga encerrar o carregamento da chave atual", async () => {
    const primeira = adiavel();
    const segunda = adiavel();
    const cargas = [primeira.promessa, segunda.promessa];
    const carregar = vi.fn(() => cargas.shift() as Promise<void>);

    const { result, rerender } = renderHook(
      ({ chave }) => useCarregarLista(chave, carregar),
      { initialProps: { chave: "a" } },
    );

    rerender({ chave: "b" });
    await waitFor(() => expect(carregar).toHaveBeenCalledTimes(2));

    // A busca antiga termina primeiro: a tela segue carregando a atual.
    await act(async () => primeira.concluir());
    expect(result.current.carregando).toBe(true);

    await act(async () => segunda.concluir());
    await waitFor(() => expect(result.current.carregando).toBe(false));
  });

  it("recarregar() repete a carga da mesma chave", async () => {
    const carregar = vi.fn(() => Promise.resolve());

    const { result } = renderHook(() => useCarregarLista("1", carregar));

    await waitFor(() => expect(result.current.carregando).toBe(false));

    act(() => result.current.recarregar());

    await waitFor(() => expect(carregar).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.carregando).toBe(false));
  });
});
