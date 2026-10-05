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
      contasPessoa: 0,
      contasFrota: 0,
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
    // Resposta antiga, sem perfil: é de oficina.
    expect(conta.perfil).toBe("oficina");
    expect(conta.conta).toBeNull();
  });

  it("lê as contas por perfil enviadas pelo backend", () => {
    const resumo = mapearResumo({
      oficinas: 1,
      contas: { pessoa: 4, frota: 2 },
      usuarios: 7,
      email_pendente: 0,
      cadastros_7_dias: 0,
      cadastros_30_dias: 0,
      ativos_7_dias: 0,
      totais: { clientes: 0, veiculos: 0, ordens_servico: 0, manutencoes: 0 },
    });

    expect(resumo.contasPessoa).toBe(4);
    expect(resumo.contasFrota).toBe(2);

    const conta = mapearConta({
      id: 3,
      nome: "Vanessa",
      email: "v@exemplo.com",
      email_confirmado: true,
      email_confirmado_em: null,
      cadastro_em: null,
      ultimo_acesso_em: null,
      admin: false,
      perfil: "pessoa",
      conta: "Vanessa",
      oficina: null,
      totais: { clientes: 0, veiculos: 2, ordens_servico: 0, manutencoes: 0 },
    });

    expect(conta.perfil).toBe("pessoa");
    expect(conta.conta).toBe("Vanessa");
  });
});
