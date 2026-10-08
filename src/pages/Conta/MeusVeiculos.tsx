import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  FipeSeletor,
  type FipeSelecao,
} from "../../components/veiculos/FipeSeletor";
import { Quadro } from "../../components/dashboard/Quadro";
import { CartaoVeiculo } from "./CartaoVeiculo";
import { AbastecimentosModal } from "./AbastecimentosModal";
import { SegurosModal } from "./SegurosModal";
import { DocumentosModal } from "./DocumentosModal";
import { DespesasModal } from "../../components/layout/DespesasModal";
import { FotosModal } from "./FotosModal";
import { contaService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { ESTADOS } from "../../utils/estados";
import { formatarMoeda } from "../../utils/formatters";
import type { VeiculoConta, VeiculoContaPayload } from "../../types/conta";

interface DadosForm {
  apelido: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  anoFabricacao: number | null;
  uf: string;
  revisao: string;
  fipe: FipeSelecao;
}

function nomeDoVeiculo(veiculo: VeiculoConta) {
  return veiculo.apelido?.trim() || `${veiculo.marca} ${veiculo.modelo}`;
}

export function MeusVeiculos() {
  const { usuario } = useAuth();
  const ehFrota = usuario?.perfil === "frota";

  const [veiculos, setVeiculos] = useState<VeiculoConta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [valorTotalFipe, setValorTotalFipe] = useState(0);
  const [recarga, setRecarga] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<VeiculoConta | null>(null);
  const [consultandoId, setConsultandoId] = useState<number | null>(null);
  const [abastecendo, setAbastecendo] = useState<VeiculoConta | null>(null);
  const [segurando, setSegurando] = useState<VeiculoConta | null>(null);
  const [documentando, setDocumentando] = useState<VeiculoConta | null>(null);
  const [gastando, setGastando] = useState<VeiculoConta | null>(null);
  const [fotografando, setFotografando] = useState<VeiculoConta | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
      setPagina(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    let cancelado = false;

    contaService
      .listarVeiculos({ pagina, busca: buscaDebounced })
      .then((resultado) => {
        if (cancelado) return;
        setVeiculos(resultado.dados);
        setTotalPaginas(resultado.totalPaginas);
        setTotalRegistros(resultado.totalRegistros);
        setValorTotalFipe(resultado.valorTotalFipe);
      })
      .catch((erro) => {
        if (!cancelado) window.alert(mensagemErro(erro));
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [pagina, buscaDebounced, recarga]);

  function recarregar() {
    setCarregando(true);
    setRecarga((atual) => atual + 1);
  }

  function irParaPagina(proxima: number) {
    setCarregando(true);
    setPagina(proxima);
  }

  async function salvar(dados: DadosForm) {
    const payload: VeiculoContaPayload = {
      apelido: dados.apelido.trim() || null,
      placa: dados.placa,
      marca: dados.marca,
      modelo: dados.modelo,
      ano: dados.ano,
      ano_fabricacao: dados.anoFabricacao,
      uf: dados.uf || null,
      revisao_prevista_em: dados.revisao || null,
      fipe_marca_id: dados.fipe.marcaId ? Number(dados.fipe.marcaId) : null,
      fipe_modelo_id: dados.fipe.modeloId ? Number(dados.fipe.modeloId) : null,
      fipe_ano: dados.fipe.ano || null,
    };

    try {
      if (editando) {
        await contaService.atualizarVeiculo(editando.id, payload);
      } else {
        await contaService.criarVeiculo(payload);
      }

      setModalAberto(false);
      setEditando(null);
      recarregar();
    } catch (erro) {
      window.alert(mensagemErro(erro));
    }
  }

  async function remover(veiculo: VeiculoConta) {
    if (!window.confirm(`Remover "${nomeDoVeiculo(veiculo)}" (${veiculo.placa})?`)) {
      return;
    }

    try {
      await contaService.removerVeiculo(veiculo.id);
      recarregar();
    } catch (erro) {
      window.alert(mensagemErro(erro));
    }
  }

  async function atualizarFipe(veiculo: VeiculoConta) {
    try {
      setConsultandoId(veiculo.id);
      await contaService.consultarFipe(veiculo.id);
      recarregar();
    } catch (erro) {
      window.alert(mensagemErro(erro));
    } finally {
      setConsultandoId(null);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[28px] leading-none font-bold tracking-wide text-gray-900 uppercase">
            {ehFrota ? "Veículos da frota" : "Meus veículos"}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Valor, IPVA e licenciamento estimados de cada veículo.
          </p>
        </div>

        <button
          onClick={() => {
            setEditando(null);
            setModalAberto(true);
          }}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Novo veículo
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Quadro
          titulo="Veículos"
          valor={String(totalRegistros)}
          detalhe={ehFrota ? "Na sua frota" : "Cadastrados"}
        />
        <Quadro
          titulo="Valor na tabela FIPE"
          valor={formatarMoeda(valorTotalFipe)}
          detalhe="Soma dos veículos com valor consultado"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-display text-xl leading-none font-bold tracking-wide text-gray-900 uppercase">
              {ehFrota ? "Veículos cadastrados" : "Seus veículos"}
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
              placeholder="Buscar por placa, apelido ou modelo..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {!carregando && veiculos.length === 0 ? (
          <p className="px-5 py-12 text-center text-xs text-gray-400">
            {buscaDebounced
              ? "Nenhum veículo encontrado."
              : "Você ainda não cadastrou nenhum veículo. Clique em “Novo veículo” para começar."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 md:grid-cols-2 2xl:grid-cols-3">
            {veiculos.map((veiculo) => (
              <CartaoVeiculo
                key={veiculo.id}
                veiculo={veiculo}
                nome={nomeDoVeiculo(veiculo)}
                consultandoFipe={consultandoId === veiculo.id}
                acoes={{
                  atualizarFipe: () => void atualizarFipe(veiculo),
                  fotos: () => setFotografando(veiculo),
                  despesas: () => setGastando(veiculo),
                  documentos: () => setDocumentando(veiculo),
                  seguro: () => setSegurando(veiculo),
                  abastecimentos: () => setAbastecendo(veiculo),
                  editar: () => {
                    setEditando(veiculo);
                    setModalAberto(true);
                  },
                  remover: () => void remover(veiculo),
                }}
              />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <p className="text-[11px] text-gray-400">
            Página {pagina} de {totalPaginas}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => irParaPagina(Math.max(1, pagina - 1))}
              disabled={pagina <= 1 || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => irParaPagina(Math.min(totalPaginas, pagina + 1))}
              disabled={pagina >= totalPaginas || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {fotografando && (
        <FotosModal
          veiculo={fotografando}
          onClose={() => {
            setFotografando(null);
            recarregar(); // a capa do cartão acompanha as fotos do álbum
          }}
        />
      )}

      {gastando && (
        <DespesasModal
          veiculoInicialId={gastando.id}
          onClose={() => setGastando(null)}
        />
      )}

      {documentando && (
        <DocumentosModal
          veiculo={documentando}
          onClose={() => setDocumentando(null)}
        />
      )}

      {segurando && (
        <SegurosModal
          veiculo={segurando}
          onClose={() => setSegurando(null)}
        />
      )}

      {abastecendo && (
        <AbastecimentosModal
          veiculo={abastecendo}
          onClose={() => setAbastecendo(null)}
        />
      )}

      {modalAberto && (
        <VeiculoContaModal
          veiculo={editando}
          onClose={() => {
            setModalAberto(false);
            setEditando(null);
          }}
          onSave={(dados) => void salvar(dados)}
        />
      )}
    </div>
  );
}

function VeiculoContaModal({
  veiculo,
  onClose,
  onSave,
}: {
  veiculo: VeiculoConta | null;
  onClose: () => void;
  onSave: (dados: DadosForm) => void;
}) {
  const [apelido, setApelido] = useState(veiculo?.apelido ?? "");
  const [placa, setPlaca] = useState(veiculo?.placa ?? "");
  const [marca, setMarca] = useState(veiculo?.marca ?? "");
  const [modelo, setModelo] = useState(veiculo?.modelo ?? "");
  const [ano, setAno] = useState(veiculo?.ano?.toString() ?? "");
  const [anoFab, setAnoFab] = useState(veiculo?.anoFabricacao?.toString() ?? "");
  const [uf, setUf] = useState(veiculo?.uf ?? "");
  const [revisao, setRevisao] = useState(veiculo?.revisaoPrevistaEm ?? "");
  const [fipe, setFipe] = useState<FipeSelecao>({
    marcaId: veiculo?.fipeMarcaId?.toString() ?? "",
    modeloId: veiculo?.fipeModeloId?.toString() ?? "",
    ano: veiculo?.fipeAno ?? "",
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const anoNumerico = Number(ano);
    const anoMaximo = new Date().getFullYear() + 1; // ano modelo pode ser o do ano seguinte

    if (
      !placa.trim() ||
      !marca.trim() ||
      !modelo.trim() ||
      Number.isNaN(anoNumerico) ||
      anoNumerico < 1900 ||
      anoNumerico > anoMaximo
    ) {
      window.alert(`Informe os dados do veículo, com ano modelo entre 1900 e ${anoMaximo}.`);
      return;
    }


    const anoFabNumerico = anoFab.trim() === "" ? null : Number(anoFab);

    if (
      anoFabNumerico !== null &&
      (!Number.isInteger(anoFabNumerico) ||
        anoNumerico - anoFabNumerico < 0 ||
        anoNumerico - anoFabNumerico > 1)
    ) {
      window.alert("O ano de fabricação deve ser igual ao ano modelo ou um ano antes dele (ex.: 2018/2019).");
      return;
    }

    onSave({
      apelido,
      placa: placa.trim().toUpperCase(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      ano: anoNumerico,
      anoFabricacao: anoFabNumerico,
      uf,
      revisao,
      fipe,
    });
  }

  const classeCampo =
    "h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {veiculo ? "Editar veículo" : "Novo veículo"}
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              Escolha na tabela FIPE para já trazer o valor do carro.
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
                Apelido (opcional)
              </label>
              <input
                type="text"
                value={apelido}
                onChange={(event) => setApelido(event.target.value)}
                maxLength={60}
                placeholder="Ex.: Carro da família, Van da entrega"
                className={classeCampo}
              />
            </div>

            <FipeSeletor
              valor={fipe}
              onChange={(selecao, nomes) => {
                setFipe(selecao);
                if (nomes.marca !== undefined) setMarca(nomes.marca);
                if (nomes.modelo !== undefined) setModelo(nomes.modelo);
                if (nomes.ano !== undefined) setAno(String(nomes.ano));
              }}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Marca
                </label>
                <input
                  type="text"
                  value={marca}
                  onChange={(event) => setMarca(event.target.value)}
                  className={classeCampo}
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
                  className={classeCampo}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Placa
                </label>
                <input
                  type="text"
                  value={placa}
                  onChange={(event) => setPlaca(event.target.value.toUpperCase())}
                  maxLength={10}
                  className={`${classeCampo} font-semibold uppercase tracking-wider`}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Ano modelo
                </label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={ano}
                  onChange={(event) => setAno(event.target.value)}
                  className={classeCampo}
                  required
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Ano do modelo (o mesmo da tabela FIPE). Pode ser o ano seguinte ao de fabricação.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Ano de fabricação (opcional)
              </label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={anoFab}
                placeholder="Ex.: 2018"
                onChange={(event) => setAnoFab(event.target.value)}
                className={classeCampo}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Se for diferente do ano modelo, informe (como no documento: 2018/2019). Só pode ser igual ao ano modelo ou um ano antes.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Estado de emplacamento
              </label>
              <select
                value={uf}
                onChange={(event) => setUf(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-500"
              >
                <option value="">Selecione (para calcular IPVA e licenciamento)</option>
                {ESTADOS.map((sigla) => (
                  <option key={sigla} value={sigla}>
                    {sigla}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                Próxima revisão (opcional)
              </label>
              <input
                type="date"
                value={revisao}
                onChange={(event) => setRevisao(event.target.value)}
                className={classeCampo}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Avisamos por e-mail quando faltar até 30 dias.
              </p>
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
              {veiculo ? "Salvar alterações" : "Cadastrar veículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
