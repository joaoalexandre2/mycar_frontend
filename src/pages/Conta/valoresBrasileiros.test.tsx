import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import api from "../../services/api";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import type { VeiculoConta } from "../../types/conta";
import { SegurosModal } from "./SegurosModal";
import { AbastecimentosModal } from "./AbastecimentosModal";
import { Servicos } from "./Servicos";

const veiculo: VeiculoConta = {
  id: 7,
  apelido: null,
  placa: "ABC1D23",
  marca: "Fiat",
  modelo: "Uno",
  ano: 2018,
  anoFabricacao: null,
  anoCompleto: "2018",
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

const segurosVazios = {
  seguros: [],
  referencia: null,
  apolice_atual_id: null,
  melhor_proposta_id: null,
  aviso: "",
};

const abastecimentosVazios = {
  abastecimentos: [],
  resumo: {
    consumo_medio_km_l: null,
    custo_por_km: null,
    total_gasto: 0,
    total_litros: 0,
    preco_medio_litro: null,
    km_atual: null,
    quantidade: 0,
  },
};

const servicosVazios = {
  tipos: [
    { tipo: "oleo", rotulo: "Troca de óleo" },
    { tipo: "outro", rotulo: "Outro" },
  ],
  servicos: [],
};

function envolver(ui: React.ReactElement) {
  return render(
    <NotificacoesProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </NotificacoesProvider>,
  );
}

function corpoDoPost(post: ReturnType<typeof vi.spyOn>) {
  return post.mock.calls[0][1] as Record<string, unknown>;
}

describe("valores digitados no formato brasileiro", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("seguro", () => {
    async function preencher(valorAnual: string, franquia = "") {
      vi.spyOn(api, "get").mockResolvedValue({ data: segurosVazios } as never);
      const post = vi
        .spyOn(api, "post")
        .mockResolvedValue({ data: segurosVazios } as never);

      envolver(<SegurosModal veiculo={veiculo} onClose={() => {}} />);

      await userEvent.type(screen.getByLabelText(/seguradora/i), "Porto");
      await userEvent.type(screen.getByLabelText(/valor por ano/i), valorAnual);
      if (franquia) {
        await userEvent.type(screen.getByLabelText(/franquia/i), franquia);
      }
      await userEvent.click(screen.getByRole("button", { name: /adicionar|registrar|salvar/i }));

      return post;
    }

    it("2.500,00 vira 2500 (e não 2,5)", async () => {
      const post = await preencher("2.500,00", "1.500");

      await waitFor(() => expect(post).toHaveBeenCalled());
      expect(corpoDoPost(post)).toMatchObject({
        valor_anual: 2500,
        franquia: 1500,
      });
    });

    it("valor inválido avisa em vez de enviar", async () => {
      const post = await preencher("dois mil");

      expect(await screen.findByText(/valor anual inválido/i)).toBeInTheDocument();
      expect(post).not.toHaveBeenCalled();
    });

    it("franquia inválida não é descartada em silêncio", async () => {
      const post = await preencher("2.500,00", "abc");

      expect(await screen.findByText(/franquia inválida/i)).toBeInTheDocument();
      expect(post).not.toHaveBeenCalled();
    });
  });

  describe("abastecimento", () => {
    async function preencher(litros: string, valor: string, km = "45200") {
      vi.spyOn(api, "get").mockResolvedValue({ data: abastecimentosVazios } as never);
      const post = vi
        .spyOn(api, "post")
        .mockResolvedValue({ data: abastecimentosVazios } as never);

      envolver(<AbastecimentosModal veiculo={veiculo} onClose={() => {}} />);

      await userEvent.type(screen.getByLabelText(/km no hodômetro/i), km);
      await userEvent.type(screen.getByLabelText(/^litros/i), litros);
      await userEvent.type(screen.getByLabelText(/valor pago/i), valor);
      await userEvent.click(screen.getByRole("button", { name: "Registrar" }));

      return post;
    }

    it("litros com vírgula e valor com milhar são lidos certo", async () => {
      const post = await preencher("38,5", "1.234,56");

      await waitFor(() => expect(post).toHaveBeenCalled());
      expect(corpoDoPost(post)).toMatchObject({
        km: 45200,
        litros: 38.5,
        valor_total: 1234.56,
      });
    });

    it("litros com ponto continuam sendo decimais (38.5 = 38,5)", async () => {
      const post = await preencher("38.5", "230");

      await waitFor(() => expect(post).toHaveBeenCalled());
      expect(corpoDoPost(post)).toMatchObject({ litros: 38.5, valor_total: 230 });
    });

    it("texto no valor avisa e não envia", async () => {
      const post = await preencher("38,5", "abc");

      expect(await screen.findByText(/informe o km/i)).toBeInTheDocument();
      expect(post).not.toHaveBeenCalled();
    });
  });

  describe("serviço", () => {
    async function registrar(campos: { valor?: string; km?: string; intervaloKm?: string }) {
      vi.spyOn(api, "get").mockImplementation(async (url: string) => {
        if (url === "/conta/servicos") return { data: servicosVazios } as never;

        return {
          data: {
            data: [
              {
                id: 7,
                apelido: null,
                placa: "ABC1D23",
                marca: "Fiat",
                modelo: "Uno",
                ano: 2018,
              },
            ],
            meta: { current_page: 1, last_page: 1, per_page: 100, total: 1 },
            resumo: { total: 1, valorTotalFipe: 0 },
          },
        } as never;
      });
      const post = vi
        .spyOn(api, "post")
        .mockResolvedValue({ data: servicosVazios } as never);

      envolver(<Servicos />);

      await userEvent.click(await screen.findByRole("button", { name: /novo serviço/i }));

      if (campos.km !== undefined) {
        await userEvent.type(screen.getByLabelText(/km do veículo/i), campos.km);
      }
      if (campos.valor !== undefined) {
        await userEvent.type(screen.getByLabelText(/valor pago/i), campos.valor);
      }
      if (campos.intervaloKm !== undefined) {
        const intervalo = screen.getByLabelText(/por quilometragem/i);
        await userEvent.clear(intervalo);
        await userEvent.type(intervalo, campos.intervaloKm);
      }

      await userEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

      return post;
    }

    it("valor 1.500 vira 1500 e km com ponto de milhar é lido inteiro", async () => {
      const post = await registrar({ valor: "1.500", km: "52.300", intervaloKm: "10.000" });

      await waitFor(() => expect(post).toHaveBeenCalled());
      expect(corpoDoPost(post)).toMatchObject({
        valor: 1500,
        km: 52300,
        intervalo_km: 10000,
      });
    });

    it("km com vírgula não vira outro número: avisa", async () => {
      const post = await registrar({ km: "52,5" });

      expect(await screen.findByText(/km do veículo inválido/i)).toBeInTheDocument();
      expect(post).not.toHaveBeenCalled();
    });

    it("valor com texto avisa em vez de sumir com o campo", async () => {
      const post = await registrar({ valor: "uns 200" });

      expect(await screen.findByText(/valor pago inválido/i)).toBeInTheDocument();
      expect(post).not.toHaveBeenCalled();
    });
  });
});
