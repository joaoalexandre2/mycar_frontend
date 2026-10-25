import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "../../services/api";
import { fipeService } from "../../services/fipe";
import { mapearVeiculo } from "../../services/veiculos";
import { mapearVeiculoConta } from "../../services/conta";
import { NotificacoesProvider } from "../../contexts/NotificacoesProvider";
import { SeletorDeTipo } from "../../components/veiculos/SeletorDeTipo";
import { VeiculoModal } from "./VeiculoModal";
import { VeiculoContaModal } from "../Conta/MeusVeiculos";
import { CartaoVeiculo } from "../Conta/CartaoVeiculo";
import { SegurosModal } from "../Conta/SegurosModal";
import { AbastecimentosModal } from "../Conta/AbastecimentosModal";
import { temEstimativas, tipoDaFipe, tipoDe } from "../../utils/tipoVeiculo";
import type { Veiculo } from "../../types/veiculo";
import type { VeiculoConta } from "../../types/conta";

afterEach(() => vi.restoreAllMocks());

const MARCAS = [{ codigo: "80", nome: "Honda" }];

function simularFipe() {
  return {
    marcas: vi.spyOn(fipeService, "marcas").mockResolvedValue(MARCAS),
    modelos: vi.spyOn(fipeService, "modelos").mockResolvedValue([{ codigo: "5000", nome: "CG 160 Fan" }]),
    anos: vi.spyOn(fipeService, "anos").mockResolvedValue([{ codigo: "2022-1", nome: "2022 Gasolina" }]),
  };
}

describe("tipo do veículo: utilitários", () => {
  it("dado ausente ou desconhecido é carro", () => {
    expect(tipoDe(undefined)).toBe("carro");
    expect(tipoDe(null)).toBe("carro");
    expect(tipoDe("barco")).toBe("carro");
    expect(tipoDe("moto")).toBe("moto");
    expect(tipoDe("caminhao")).toBe("caminhao");
  });

  it("cada tipo consulta a sua tabela da FIPE", () => {
    expect(tipoDaFipe("carro")).toBe("carros");
    expect(tipoDaFipe("moto")).toBe("motos");
    expect(tipoDaFipe("caminhao")).toBe("caminhoes");
  });

  it("estimativas de IPVA, ficha e seguro são só de carro", () => {
    expect(temEstimativas("carro")).toBe(true);
    expect(temEstimativas("moto")).toBe(false);
    expect(temEstimativas("caminhao")).toBe(false);
  });
});

describe("fipeService: tabela do tipo", () => {
  it("carro vai sem tipo na consulta (é o padrão do servidor)", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [] } as never);

    await fipeService.marcas();
    await fipeService.marcas("carro");

    expect(get).toHaveBeenNthCalledWith(1, "/fipe/marcas", undefined);
    expect(get).toHaveBeenNthCalledWith(2, "/fipe/marcas", undefined);
  });

  it("moto e caminhão levam o tipo em todas as consultas", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: { modelos: [] } } as never);

    await fipeService.marcas("moto");
    await fipeService.modelos("80", "moto");
    await fipeService.anos("80", "5000", "caminhao");
    await fipeService.anosDaMarca("80", "caminhao");
    await fipeService.modelosDoAno("80", "2022-1", "moto");

    expect(get).toHaveBeenNthCalledWith(1, "/fipe/marcas", { params: { tipo: "motos" } });
    expect(get).toHaveBeenNthCalledWith(2, "/fipe/marcas/80/modelos", { params: { tipo: "motos" } });
    expect(get).toHaveBeenNthCalledWith(3, "/fipe/marcas/80/modelos/5000/anos", { params: { tipo: "caminhoes" } });
    expect(get).toHaveBeenNthCalledWith(4, "/fipe/marcas/80/anos", { params: { tipo: "caminhoes" } });
    expect(get).toHaveBeenNthCalledWith(5, "/fipe/marcas/80/anos/2022-1/modelos", { params: { tipo: "motos" } });
  });
});

describe("veículos da API: tipo_veiculo", () => {
  const base = { id: 1, placa: "ABC1D23", marca: "Honda", modelo: "CG", ano: 2022 };

  it("a conta lê o tipo e, sem o campo, assume carro", () => {
    expect(mapearVeiculoConta({ ...base, tipo_veiculo: "moto" }).tipoVeiculo).toBe("moto");
    expect(mapearVeiculoConta({ ...base, tipo_veiculo: "caminhao" }).tipoVeiculo).toBe("caminhao");
    expect(mapearVeiculoConta(base).tipoVeiculo).toBe("carro");
  });

  it("a oficina lê o tipo e, sem o campo, assume carro", () => {
    expect(mapearVeiculo({ ...base, cliente_id: 3, tipo_veiculo: "moto" }).tipoVeiculo).toBe("moto");
    expect(mapearVeiculo({ ...base, cliente_id: 3 }).tipoVeiculo).toBe("carro");
  });
});

describe("SeletorDeTipo", () => {
  it("mostra carro, moto e caminhão com o tipo atual marcado", () => {
    render(<SeletorDeTipo valor="moto" onChange={() => {}} />);

    expect(screen.getByRole("radio", { name: "Carro" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Moto" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Caminhão" })).not.toBeChecked();
  });

  it("avisa o tipo escolhido", async () => {
    const aoMudar = vi.fn();
    render(<SeletorDeTipo valor="carro" onChange={aoMudar} />);

    await userEvent.click(screen.getByRole("radio", { name: "Caminhão" }));

    expect(aoMudar).toHaveBeenCalledWith("caminhao");
  });
});

describe("cadastro de veículo escolhe o tipo", () => {
  const veiculoDaOficina = {
    id: 9, clienteId: 3, tipoVeiculo: "carro", placa: "ABC1D23", marca: "Honda", modelo: "CG 160 Fan",
    ano: 2022, anoFabricacao: null, uf: "RS", fipeMarcaId: 80, fipeModeloId: 5000, fipeAno: "2022-1",
    cliente: { id: 3, nome: "Ana" },
  } as unknown as Veiculo;

  it("oficina: trocar para moto consulta a FIPE de motos e envia o tipo", async () => {
    const fipe = simularFipe();
    const aoSalvar = vi.fn();
    render(
      <NotificacoesProvider>
        <VeiculoModal veiculo={veiculoDaOficina} onClose={() => {}} onSave={aoSalvar} />
      </NotificacoesProvider>,
    );

    await waitFor(() => expect(fipe.marcas).toHaveBeenCalledWith("carro"));

    await userEvent.click(screen.getByRole("radio", { name: "Moto" }));

    // A escolha da FIPE de carro some e a lista de motos é carregada.
    await waitFor(() => expect(fipe.marcas).toHaveBeenLastCalledWith("moto"));
    expect(screen.getByRole("combobox", { name: "Marca FIPE" })).toHaveValue("");

    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(aoSalvar).toHaveBeenCalled());
    expect(aoSalvar.mock.calls[0][0]).toMatchObject({
      tipo: "moto",
      placa: "ABC1D23",
      fipe: { marcaId: "", modeloId: "", ano: "" },
    });
  });

  it("oficina: sem mexer no tipo, o veículo continua carro", async () => {
    simularFipe();
    const aoSalvar = vi.fn();
    render(
      <NotificacoesProvider>
        <VeiculoModal veiculo={veiculoDaOficina} onClose={() => {}} onSave={aoSalvar} />
      </NotificacoesProvider>,
    );

    expect(screen.getByRole("radio", { name: "Carro" })).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(aoSalvar).toHaveBeenCalled());
    expect(aoSalvar.mock.calls[0][0]).toMatchObject({ tipo: "carro", fipe: { marcaId: "80", modeloId: "5000", ano: "2022-1" } });
  });

  it("conta: editar uma moto abre com Moto marcado e consulta a FIPE de motos", async () => {
    const fipe = simularFipe();
    const veiculo = {
      id: 4, tipoVeiculo: "moto", apelido: null, placa: "ABC1D23", marca: "Honda", modelo: "CG 160 Fan",
      ano: 2022, anoFabricacao: null, uf: "RS", fipeMarcaId: null, fipeModeloId: null, fipeAno: null, revisaoPrevistaEm: null,
    } as unknown as VeiculoConta;
    const aoSalvar = vi.fn();

    render(
      <NotificacoesProvider>
        <VeiculoContaModal veiculo={veiculo} centros={null} onClose={() => {}} onSave={aoSalvar} />
      </NotificacoesProvider>,
    );

    expect(screen.getByRole("radio", { name: "Moto" })).toBeChecked();
    await waitFor(() => expect(fipe.marcas).toHaveBeenCalledWith("moto"));

    await userEvent.click(screen.getByRole("radio", { name: "Caminhão" }));
    await waitFor(() => expect(fipe.marcas).toHaveBeenLastCalledWith("caminhao"));

    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(aoSalvar).toHaveBeenCalled());
    expect(aoSalvar.mock.calls[0][0]).toMatchObject({ tipo: "caminhao" });
  });

  it("conta: um veículo novo começa como carro", () => {
    simularFipe();
    render(
      <NotificacoesProvider>
        <VeiculoContaModal veiculo={null} centros={null} onClose={() => {}} onSave={() => {}} />
      </NotificacoesProvider>,
    );

    expect(screen.getByRole("radio", { name: "Carro" })).toBeChecked();
  });
});

describe("telas ajustadas ao tipo", () => {
  const acoes = {
    atualizarFipe: vi.fn(), fotos: vi.fn(), despesas: vi.fn(), documentos: vi.fn(), seguro: vi.fn(),
    abastecimentos: vi.fn(), editar: vi.fn(), remover: vi.fn(),
  };

  function veiculo(tipoVeiculo: string): VeiculoConta {
    return {
      id: 1, tipoVeiculo, apelido: null, placa: "ABC1D23", marca: "Honda", modelo: "CG 160 Fan", ano: 2022,
      anoFabricacao: null, anoCompleto: "2022", isentoIpva: false, possivelIsencaoIpva: false, fotoCapaUrl: null,
      fotoModelo: null, uf: "RS", ipvaEstimado: null, licenciamentoValor: null, proximoVencimentoIpva: "2027-01-31",
      proximoVencimentoLicenciamento: "2026-11-30", revisaoPrevistaEm: null, fipeMarcaId: null, fipeModeloId: null,
      fipeAno: null, fipeValor: 14000, fipeConsultadoEm: null, kmAtual: null, kmAtualizadoEm: null, centroCustoId: null,
    } as unknown as VeiculoConta;
  }

  it("o cartão da moto mostra o tipo, o IPVA estimado e avisa que o licenciamento é só de carro", () => {
    render(
      <CartaoVeiculo
        veiculo={{ ...veiculo("moto"), ipvaEstimado: 280 }}
        nome="CG"
        consultandoFipe={false}
        acoes={acoes as never}
      />,
    );

    expect(screen.getByText(/Honda CG 160 Fan · 2022 · Moto/)).toBeInTheDocument();
    expect(screen.getByText(/licenciamento é estimado só para carros/)).toBeInTheDocument();
    expect(screen.getByText(/Motos de baixa cilindrada podem ser isentas de IPVA/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*280,00/)).toBeInTheDocument();
  });

  it("o cartão do caminhão avisa do licenciamento, mas não fala de moto", () => {
    render(<CartaoVeiculo veiculo={veiculo("caminhao")} nome="FH" consultandoFipe={false} acoes={acoes as never} />);

    expect(screen.getByText(/licenciamento é estimado só para carros/)).toBeInTheDocument();
    expect(screen.queryByText(/Motos de baixa cilindrada/)).not.toBeInTheDocument();
  });

  it("estado sem alíquota confirmada mostra o aviso de alíquota média também na moto", () => {
    render(
      <CartaoVeiculo
        veiculo={{ ...veiculo("moto"), ipvaEstimado: 280, ipvaAliquotaMedia: true }}
        nome="CG"
        consultandoFipe={false}
        acoes={acoes as never}
      />,
    );

    expect(screen.getByText("alíquota média do país")).toBeInTheDocument();
  });

  it("o cartão do carro não mostra o tipo nem os avisos de moto e caminhão", () => {
    render(<CartaoVeiculo veiculo={veiculo("carro")} nome="Uno" consultandoFipe={false} acoes={acoes as never} />);

    expect(screen.queryByText(/licenciamento é estimado só para carros/)).not.toBeInTheDocument();
    expect(screen.queryByText(/· Moto/)).not.toBeInTheDocument();
  });

  it("seguro de caminhão explica que não há referência de mercado", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: { possui_seguro: null, seguros: [], referencia: null, apolice_atual_id: null, melhor_proposta_id: null, aviso: "" },
    } as never);

    render(
      <NotificacoesProvider>
        <SegurosModal veiculo={veiculo("caminhao")} onClose={() => {}} />
      </NotificacoesProvider>,
    );

    expect(await screen.findByText(/Não há referência de mercado para caminhões/)).toBeInTheDocument();
  });

  it("seguro de moto mostra a referência de mercado que o servidor calculou", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        possui_seguro: null,
        seguros: [],
        referencia: { baixo: 938, medio: 1218, alto: 1414 },
        apolice_atual_id: null,
        melhor_proposta_id: null,
        aviso: "",
      },
    } as never);

    render(
      <NotificacoesProvider>
        <SegurosModal veiculo={veiculo("moto")} onClose={() => {}} />
      </NotificacoesProvider>,
    );

    expect(await screen.findByText(/R\$\s*938,00 a R\$\s*1\.414,00 por ano/)).toBeInTheDocument();
    expect(screen.queryByText(/Não há referência de mercado/)).not.toBeInTheDocument();
  });

  it("abastecimento de caminhão avisa que não há a capacidade do tanque", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        tanque_litros: null,
        abastecimentos: [],
        resumo: { consumo_medio_km_l: null, custo_por_km: null, total_gasto: 0, total_litros: 0, preco_medio_litro: null, km_atual: null, quantidade: 0 },
      },
    } as never);

    render(
      <NotificacoesProvider>
        <AbastecimentosModal veiculo={veiculo("caminhao")} onClose={() => {}} />
      </NotificacoesProvider>,
    );

    const dialogo = await screen.findByRole("dialog");
    expect(await within(dialogo).findByText(/Para motos e caminhões não temos a capacidade do tanque/)).toBeInTheDocument();
  });
});
