import { useEffect, useState } from "react";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Cliente } from "../../types/cliente";
import type { Veiculo } from "../../types/veiculo";
import { clientesService } from "../../services/clientes";
import {
  veiculosService,
  type ResumoVeiculos,
} from "../../services/veiculos";
import { mensagemErro } from "../../services/api";

const RESUMO_INICIAL: ResumoVeiculos = {
  total: 0,
  clientesComVeiculo: 0,
  marcas: 0,
  anoMedio: 0,
};

export function Veiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [resumo, setResumo] = useState<ResumoVeiculos>(RESUMO_INICIAL);
  const [modalAberto, setModalAberto] = useState(false);
  const [veiculoEditando, setVeiculoEditando] =
    useState<Veiculo | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
      setPagina(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [busca]);

  async function carregar() {
    try {
      setCarregando(true);
      const [resultado, listaClientes] = await Promise.all([
        veiculosService.listarPaginado({
          pagina,
          busca: buscaDebounced,
        }),
        clientesService.listar(),
      ]);

      if (
        resultado.dados.length === 0 &&
        pagina > 1 &&
        resultado.totalRegistros > 0
      ) {
        setPagina((atual) => Math.max(1, atual - 1));
        return;
      }

      setVeiculos(resultado.dados);
      setTotalPaginas(resultado.totalPaginas);
      setTotalRegistros(resultado.totalRegistros);
      setResumo(resultado.resumo);
      setClientes(listaClientes);
    } catch (error) {
      window.alert(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, buscaDebounced]);

  const anoMedioArredondado = Math.round(resumo.anoMedio);

  function nomeCliente(veiculo: Veiculo) {
    return (
      veiculo.cliente?.nome ??
      clientes.find((item) => item.id === veiculo.clienteId)?.nome ??
      "Cliente não encontrado"
    );
  }

  async function excluirVeiculo(id: number) {
    const veiculo = veiculos.find((item) => item.id === id);

    if (!veiculo) {
      return;
    }

    const confirmar = window.confirm(
      `Deseja realmente excluir o veículo "${veiculo.marca} ${veiculo.modelo}"?`,
    );

    if (!confirmar) {
      return;
    }

    try {
      await veiculosService.remover(id);
      await carregar();
    } catch (error) {
      window.alert(mensagemErro(error));
    }
  }

  async function salvarVeiculo(payload: {
    clienteId: number;
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
  }) {
    const dados = {
      cliente_id: payload.clienteId,
      placa: payload.placa,
      marca: payload.marca,
      modelo: payload.modelo,
      ano: payload.ano,
    };

    try {
      if (veiculoEditando) {
        await veiculosService.atualizar(veiculoEditando.id, dados);
      } else {
        await veiculosService.criar(dados);
      }

      setModalAberto(false);
      setVeiculoEditando(null);
      await carregar();
    } catch (error) {
      window.alert(mensagemErro(error));
    }
  }

  return (
    <div className="p-8">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h2 className="text-[21px] font-bold text-gray-900">Veículos</h2>
          <p className="mt-1 text-xs text-gray-500">
            Cadastre e gerencie os veículos dos clientes.
          </p>
        </div>
        <button
          onClick={() => {
            setVeiculoEditando(null);
            setModalAberto(true);
          }}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Novo veículo
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Total de veículos" value={resumo.total} icon={<Car size={19} />} />
        <InfoCard label="Clientes com veículo" value={resumo.clientesComVeiculo} icon={<Car size={19} />} />
        <InfoCard label="Marcas" value={resumo.marcas} icon={<Car size={19} />} />
        <InfoCard label="Ano médio" value={anoMedioArredondado || "—"} icon={<Car size={19} />} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Veículos cadastrados
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              {carregando
                ? "Carregando..."
                : `${totalRegistros} veículo(s) encontrado(s)`}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar veículo..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Veículo
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Placa
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Cliente
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Ano
                </th>
                <th className="w-28 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {veiculos.map((veiculo) => (
                <tr
                  key={veiculo.id}
                  className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Car size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          {veiculo.marca} {veiculo.modelo}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          ID #{veiculo.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10px] font-bold tracking-wider text-gray-700">
                      {veiculo.placa}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {nomeCliente(veiculo)}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {veiculo.ano}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setVeiculoEditando(veiculo);
                          setModalAberto(true);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => void excluirVeiculo(veiculo.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        title="Mais opções"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!carregando && veiculos.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-xs text-gray-400"
                  >
                    Nenhum veículo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <p className="text-[11px] text-gray-400">
            Página {pagina} de {totalPaginas}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
              disabled={pagina <= 1 || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>

            <button
              type="button"
              onClick={() =>
                setPagina((atual) => Math.min(totalPaginas, atual + 1))
              }
              disabled={pagina >= totalPaginas || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {modalAberto && (
        <VeiculoModal
          veiculo={veiculoEditando}
          clientes={clientes}
          onClose={() => {
            setModalAberto(false);
            setVeiculoEditando(null);
          }}
          onSave={(dados) => void salvarVeiculo(dados)}
        />
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-blue-600">{icon}</span>
      </div>
      <strong className="text-2xl font-bold text-gray-900">{value}</strong>
    </div>
  );
}

function VeiculoModal({
  veiculo,
  clientes,
  onClose,
  onSave,
}: {
  veiculo: Veiculo | null;
  clientes: Cliente[];
  onClose: () => void;
  onSave: (veiculo: {
    clienteId: number;
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
  }) => void;
}) {
  const [clienteId, setClienteId] = useState(
    veiculo?.clienteId?.toString() ?? "",
  );
  const [placa, setPlaca] = useState(veiculo?.placa ?? "");
  const [marca, setMarca] = useState(veiculo?.marca ?? "");
  const [modelo, setModelo] = useState(veiculo?.modelo ?? "");
  const [ano, setAno] = useState(veiculo?.ano?.toString() ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const anoNumerico = Number(ano);
    const anoAtual = new Date().getFullYear();

    if (
      !clienteId ||
      !placa.trim() ||
      !marca.trim() ||
      !modelo.trim() ||
      Number.isNaN(anoNumerico) ||
      anoNumerico < 1900 ||
      anoNumerico > anoAtual
    ) {
      window.alert(`Informe os dados do veículo com ano entre 1900 e ${anoAtual}.`);
      return;
    }

    onSave({
      clienteId: Number(clienteId),
      placa: placa.trim().toUpperCase(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      ano: anoNumerico,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {veiculo ? "Editar veículo" : "Novo veículo"}
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              Informe os dados do veículo.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Cliente
              </label>
              <select
                value={clienteId}
                onChange={(event) => setClienteId(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-500"
                required
              >
                <option value="">Selecione o cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Marca
                </label>
                <input
                  type="text"
                  value={marca}
                  onChange={(event) => setMarca(event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Modelo
                </label>
                <input
                  type="text"
                  value={modelo}
                  onChange={(event) => setModelo(event.target.value)}
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Placa
              </label>
              <input
                type="text"
                value={placa}
                onChange={(event) =>
                  setPlaca(event.target.value.toUpperCase())
                }
                maxLength={10}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs font-semibold tracking-wider uppercase outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Ano
              </label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={ano}
                onChange={(event) => setAno(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
            >
              {veiculo ? "Salvar alterações" : "Criar veículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
