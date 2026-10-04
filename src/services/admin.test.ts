import { describe, expect, it } from "vitest";
import { mapearConta, mapearResumo } from "./admin";

describe("admin service", () => {
  it("converte o resumo da plataforma para camelCase", () => {
    const resumo = mapearResumo({
      oficinas: 3,
      usuarios: 4,
      email_pendente: 2,
      cadastros_7_dias: 1,
      cadastros_30_dias: 4,
      ativos_7_dias: 2,
      totais: { clientes: 10, veiculos: 8, ordens_servico: 5, manutencoes: 7 },
    });

    expect(resumo).toEqual({
      oficinas: 3,
      usuarios: 4,
      emailPendente: 2,
      cadastros7Dias: 1,
      cadastros30Dias: 4,
      ativos7Dias: 2,
      totais: { clientes: 10, veiculos: 8, ordensServico: 5, manutencoes: 7 },
    });
  });

  it("converte uma conta e trata oficina ausente", () => {
    const conta = mapearConta({
      id: 9,
      nome: "Sergio",
      email: "sergio@exemplo.com",
      email_confirmado: false,
      email_confirmado_em: null,
      cadastro_em: "2026-10-04T10:00:00-03:00",
      ultimo_acesso_em: null,
      admin: false,
      oficina: null,
      totais: { clientes: 0, veiculos: 0, ordens_servico: 0, manutencoes: 0 },
    });

    expect(conta.emailConfirmado).toBe(false);
    expect(conta.oficina).toBeNull();
    expect(conta.ultimoAcessoEm).toBeNull();
    expect(conta.totais.ordensServico).toBe(0);
  });
});
