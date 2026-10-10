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
