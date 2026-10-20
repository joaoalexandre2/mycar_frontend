import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { VeiculoConta } from "../../types/conta";
import { CartaoVeiculo } from "./CartaoVeiculo";

const acoes = {
  atualizarFipe: vi.fn(),
  fotos: vi.fn(),
  despesas: vi.fn(),
  documentos: vi.fn(),
  seguro: vi.fn(),
  abastecimentos: vi.fn(),
  editar: vi.fn(),
  remover: vi.fn(),
};

const base: VeiculoConta = {
  id: 1,
  apelido: null,
  placa: "FJB4E12",
  marca: "Fiat",
  modelo: "Strada",
  ano: 2020,
  anoFabricacao: null,
  anoCompleto: "2020",
  isentoIpva: false,
  possivelIsencaoIpva: false,
  fotoCapaUrl: null,
  fotoModelo: null,
  uf: "RS",
  ipvaEstimado: null,
  licenciamentoValor: null,
  proximoVencimentoIpva: null,
  proximoVencimentoLicenciamento: null,
  revisaoPrevistaEm: null,
  fipeMarcaId: null,
  fipeModeloId: null,
  fipeAno: null,
  fipeValor: null,
  fipeConsultadoEm: null,
};

const fotoModelo = {
  modelo: "Fiat Strada",
  url: "https://api.exemplo.com/api/imagens-modelos/fiat-strada",
  autor: "Fulano de Tal",
  licenca: "CC BY-SA 4.0",
  licencaUrl: "https://creativecommons.org/licenses/by-sa/4.0",
  pagina: "https://commons.wikimedia.org/wiki/File:Strada.jpg",
  fonte: "Wikimedia Commons",
};

function montar(veiculo: VeiculoConta) {
  return render(
    <CartaoVeiculo veiculo={veiculo} nome="Strada" consultandoFipe={false} acoes={acoes as never} />,
  );
}

describe("CartaoVeiculo: IPVA e a isenção por idade", () => {
  it("carro com mais de 20 anos mostra Isento, sem valor nem data de vencimento", () => {
    montar({
      ...base,
      modelo: "Palio",
      ano: 2001,
      anoFabricacao: 2001,
      anoCompleto: "2001",
      isentoIpva: true,
      ipvaEstimado: null,
      proximoVencimentoIpva: null,
    });

    expect(screen.getByText("Isento")).toBeInTheDocument();
    expect(screen.getByText(/mais de 20 anos de fabricação/i)).toBeInTheDocument();
    expect(screen.queryByText(/vence \(est\.\)/)).not.toBeInTheDocument();
    // O aviso de "pode ser isento" é só para 15 a 20 anos.
    expect(screen.queryByText(/15 a 20 anos/)).not.toBeInTheDocument();
  });

  it("isento aparece mesmo sem o estado informado (a regra vale no país todo)", () => {
    montar({ ...base, uf: null, isentoIpva: true });

    expect(screen.getByText("Isento")).toBeInTheDocument();
    expect(screen.queryByText(/Informe o estado de emplacamento/)).not.toBeInTheDocument();
  });

  it("carro comum mostra o valor estimado e o vencimento, sem Isento", () => {
    montar({ ...base, ipvaEstimado: 1520, proximoVencimentoIpva: "2027-01-31" });

    expect(screen.queryByText("Isento")).not.toBeInTheDocument();
    expect(screen.getByText(/≈/)).toBeInTheDocument();
    expect(screen.getByText(/vence \(est\.\)/)).toBeInTheDocument();
  });

  it("de 15 a 20 anos continua só o aviso de possível isenção, com o valor estimado", () => {
    montar({ ...base, ano: 2011, possivelIsencaoIpva: true, ipvaEstimado: 900, proximoVencimentoIpva: "2027-01-31" });

    expect(screen.getByText(/Carro com 15 a 20 anos: alguns estados isentam o IPVA/)).toBeInTheDocument();
    expect(screen.queryByText("Isento")).not.toBeInTheDocument();
    expect(screen.getByText(/≈/)).toBeInTheDocument();
  });
});

describe("CartaoVeiculo: capa", () => {
  it("sem foto do dono, usa a foto do modelo e mostra autor, licença e fonte", () => {
    montar({ ...base, fotoModelo });

    expect(screen.getByAltText(/Foto ilustrativa do modelo Fiat Strada/)).toHaveAttribute(
      "src",
      fotoModelo.url,
    );
    expect(screen.getByText(/Fulano de Tal/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CC BY-SA 4.0" })).toHaveAttribute(
      "href",
      fotoModelo.licencaUrl,
    );
    expect(screen.getByRole("link", { name: "Wikimedia Commons" })).toHaveAttribute(
      "href",
      fotoModelo.pagina,
    );
  });

  it("a foto do dono tem prioridade e dispensa o crédito", () => {
    montar({ ...base, fotoCapaUrl: "https://api.exemplo.com/api/fotos/9/miniatura", fotoModelo });

    expect(screen.getByAltText(/Foto de Strada/)).toBeInTheDocument();
    expect(screen.queryByAltText(/Foto ilustrativa/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fulano de Tal/)).not.toBeInTheDocument();
  });

  it("sem nenhuma foto, não mostra crédito", () => {
    montar(base);

    expect(screen.queryByText(/Foto ilustrativa/)).not.toBeInTheDocument();
  });
});
