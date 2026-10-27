import { useEffect, useId, useRef, useState } from "react";
import { useToast, useConfirmar } from "../../hooks/useNotificacoes";
import { useEnvio } from "../../hooks/useEnvio";
import { useErrosDeCampo } from "../../hooks/useErrosDeCampo";
import { ErroDoCampo } from "../../components/ui/ErroDoCampo";
import { useCarregarLista } from "../../hooks/useCarregarLista";
import { ErroDeLista } from "../../components/ui/ErroDeLista";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
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
import { centrosCustoService } from "../../services/frota";
import { CorrigirKmModal } from "../../components/frota/CorrigirKmModal";
import { mensagemErro } from "../../services/api";
import { Modal } from "../../components/ui/Modal";
import { useAuth } from "../../hooks/useAuth";
import { ESTADOS } from "../../utils/estados";
import { formatarMoeda } from "../../utils/formatters";
import { limparPlaca, padraoDaPlaca, placaValida, ROTULO_PADRAO } from "../../utils/placa";
import type { VeiculoConta, VeiculoContaPayload } from "../../types/conta";
import type { TipoVeiculo } from "../../types/veiculo";
import { SeletorDeTipo } from "../../components/veiculos/SeletorDeTipo";
import type { CentroCusto } from "../../types/frota";

interface DadosForm {
  tipo: TipoVeiculo;
  apelido: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  anoFabricacao: number | null;
  uf: string;
  revisao: string;
  fipe: FipeSelecao;
  /** Centro de custo padrão (só a frota escolhe). */
  centroCustoId: number | null;
}

function nomeDoVeiculo(veiculo: VeiculoConta) {
  return veiculo.apelido?.trim() || `${veiculo.marca} ${veiculo.modelo}`;
}

export function MeusVeiculos() {
  const toast = useToast();
  const pedirConfirmacao = useConfirmar();
  const { usuario } = useAuth();
  const ehFrota = usuario?.perfil === "frota";

  const [veiculos, setVeiculos] = useState<VeiculoConta[]>([]);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [valorTotalFipe, setValorTotalFipe] = useState(0);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<VeiculoConta | null>(null);
  const [centros, setCentros] = useState<CentroCusto[] | null>(null);
  const [corrigindoKm, setCorrigindoKm] = useState<VeiculoConta | null>(null);
  const [consultandoId, setConsultandoId] = useState<number | null>(null);
  const [abastecendo, setAbastecendo] = useState<VeiculoConta | null>(null);
  const [segurando, setSegurando] = useState<VeiculoConta | null>(null);
  const [documentando, setDocumentando] = useState<VeiculoConta | null>(null);
  const [gastando, setGastando] = useState<VeiculoConta | null>(null);
  const [fotografando, setFotografando] = useState<VeiculoConta | null>(null);

  // Só volta para a página 1 quando o texto buscado de fato mudou: sem isto, o
  // timer disparado logo depois de abrir a tela jogava a pessoa de volta para
  // a página 1 se ela tivesse acabado de ir para a 2.
  const buscaAplicada = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (buscaAplicada.current === busca) return;

      buscaAplicada.current = busca;
      setBuscaDebounced(busca);
      setPagina(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [busca]);

  const { carregando, erro: erroDaLista, recarregar } = useCarregarLista(
    `${pagina}|${buscaDebounced}`,
    async (ativo) => {
      try {
        const resultado = await contaService.listarVeiculos({
          pagina,
          busca: buscaDebounced,
        });

        if (!ativo()) return;

        // Removeu o último veículo da página: volta para a anterior em vez de
        // mostrar uma página vazia (e a mensagem de "nenhum veículo").
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
        setValorTotalFipe(resultado.valorTotalFipe);
      } catch (erro) {
        // O hook guarda a falha e a tela mostra o erro com "Tentar de novo".
        if (ativo()) throw erro;
      }
    },
  );

  // Centros de custo para o campo "padrão" do veículo: só a frota usa.
  useEffect(() => {
    if (!ehFrota) return;

    let ativo = true;

    centrosCustoService
      .listar()
      .then((lista) => {
        if (ativo) setCentros(lista);
      })
      .catch(() => {
        // Sem a lista o campo só fica vazio: o veículo continua podendo ser salvo.
      });

    return () => {
      ativo = false;
    };
  }, [ehFrota]);

  async function salvar(dados: DadosForm) {
    const payload: VeiculoContaPayload = {
      tipo_veiculo: dados.tipo,
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
      // Só a frota usa centro de custo: nos outros perfis o campo nem é enviado.
      ...(ehFrota ? { centro_custo_id: dados.centroCustoId } : {}),
    };

    try {
      if (editando) {
        await contaService.atualizarVeiculo(editando.id, payload);
      } else {
        await contaService.criarVeiculo(payload);
      }

      toast.sucesso(editando ? "Veículo salvo." : "Veículo cadastrado.");
      setModalAberto(false);
      setEditando(null);
      recarregar();
    } catch (erro) {
      toast.erro(mensagemErro(erro));
    }
  }

  async function remover(veiculo: VeiculoConta) {
    if (!(await pedirConfirmacao({
      mensagem: `Remover "${nomeDoVeiculo(veiculo)}" (${veiculo.placa})?`,
      confirmarTexto: "Remover",
      perigo: true,
    }))) {
      return;
    }

    try {
      await contaService.removerVeiculo(veiculo.id);
      toast.sucesso("Veículo removido.");
      recarregar();
    } catch (erro) {
      toast.erro(mensagemErro(erro));
    }
  }

  async function atualizarFipe(veiculo: VeiculoConta) {
    try {
      setConsultandoId(veiculo.id);
      await contaService.consultarFipe(veiculo.id);
      recarregar();
    } catch (erro) {
      toast.erro(mensagemErro(erro));
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
            <p className="mt-1 text-xs text-gray-500">
              {carregando
                ? "Carregando..."
                : erroDaLista
                  ? "Falha ao carregar."
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
              aria-label="Buscar veículo"
              placeholder="Buscar por placa, apelido ou modelo..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-500 focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {erroDaLista && (


          <ErroDeLista


            mensagem={erroDaLista}


            aoTentarDeNovo={recarregar}


          />


        )}



        {!carregando && !erroDaLista && veiculos.length === 0 ? (
          <p className="px-5 py-12 text-center text-xs text-gray-500">
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
                  corrigirKm: ehFrota ? () => setCorrigindoKm(veiculo) : undefined,
                }}
              />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <p className="text-xs text-gray-500">
            Página {pagina} de {totalPaginas}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagina(Math.max(1, pagina - 1))}
              disabled={pagina <= 1 || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
              disabled={pagina >= totalPaginas || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
          veiculoInicial={gastando}
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

      {corrigindoKm && (
        <CorrigirKmModal
          veiculo={corrigindoKm}
          onSalvo={() => {
            setCorrigindoKm(null);
            recarregar();
          }}
          onClose={() => setCorrigindoKm(null)}
        />
      )}

      {modalAberto && (
        <VeiculoContaModal
          veiculo={editando}
          centros={ehFrota ? (centros ?? []) : null}
          onClose={() => {
            setModalAberto(false);
            setEditando(null);
          }}
          onSave={salvar}
        />
      )}
    </div>
  );
}

export function VeiculoContaModal({
  veiculo,
  centros,
  onClose,
  onSave,
}: {
  veiculo: VeiculoConta | null;
  /** Centros de custo da frota; vazio (null) nos outros perfis, que não escolhem. */
  centros: CentroCusto[] | null;
  onClose: () => void;
  onSave: (dados: DadosForm) => void | Promise<void>;
}) {
  const { enviando, enviar } = useEnvio();
  const { erros, mostrar, limpar, atributos } = useErrosDeCampo();
  const idApelido = useId();
  const idMarca = useId();
  const idModelo = useId();
  const idPlaca = useId();
  const idAjudaPlaca = useId();
  const idAno = useId();
  const idAjudaAno = useId();
  const idAnoFab = useId();
  const idAjudaAnoFab = useId();
  const idUf = useId();
  const idRevisao = useId();
  const idAjudaRevisao = useId();
  const [tipo, setTipo] = useState<TipoVeiculo>(veiculo?.tipoVeiculo ?? "carro");
  const [apelido, setApelido] = useState(veiculo?.apelido ?? "");
  const [placa, setPlaca] = useState(veiculo?.placa ?? "");
  const [marca, setMarca] = useState(veiculo?.marca ?? "");
  const [modelo, setModelo] = useState(veiculo?.modelo ?? "");
  const [ano, setAno] = useState(veiculo?.ano?.toString() ?? "");
  const [anoFab, setAnoFab] = useState(veiculo?.anoFabricacao?.toString() ?? "");
  const [uf, setUf] = useState(veiculo?.uf ?? "");
  const [revisao, setRevisao] = useState(veiculo?.revisaoPrevistaEm ?? "");
  const [centroId, setCentroId] = useState(veiculo?.centroCustoId ? String(veiculo.centroCustoId) : "");
  const [fipe, setFipe] = useState<FipeSelecao>({
    marcaId: veiculo?.fipeMarcaId?.toString() ?? "",
    modeloId: veiculo?.fipeModeloId?.toString() ?? "",
    ano: veiculo?.fipeAno ?? "",
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const anoNumerico = Number(ano);
    const anoMaximo = new Date().getFullYear() + 1; // ano modelo pode ser o do ano seguinte

    const novos: Record<string, string> = {};

    if (!marca.trim()) novos[idMarca] = "Informe a marca.";
    if (!modelo.trim()) novos[idModelo] = "Informe o modelo.";

    if (!placa.trim()) {
      novos[idPlaca] = "Informe a placa.";
    } else if (!placaValida(placa)) {
      novos[idPlaca] =
        "Placa inválida. Use o padrão antigo (ABC1234) ou o Mercosul (ABC1D23).";
    }

    if (
      Number.isNaN(anoNumerico) ||
      anoNumerico < 1900 ||
      anoNumerico > anoMaximo
    ) {
      novos[idAno] = `Informe o ano modelo, entre 1900 e ${anoMaximo}.`;
    }

    const anoFabNumerico = anoFab.trim() === "" ? null : Number(anoFab);

    if (
      anoFabNumerico !== null &&
      (!Number.isInteger(anoFabNumerico) ||
        anoNumerico - anoFabNumerico < 0 ||
        anoNumerico - anoFabNumerico > 1)
    ) {
      novos[idAnoFab] =
        "O ano de fabricação deve ser igual ao ano modelo ou um ano antes dele (ex.: 2018/2019).";
    }

    if (Object.keys(novos).length > 0) {
      mostrar(novos, [
        idMarca,
        idModelo,
        idPlaca,
        idAno,
        idAnoFab,
      ]);
      return;
    }

    void enviar(() =>
      onSave({
        tipo,
        apelido,
        placa: placa.trim().toUpperCase(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        ano: anoNumerico,
        anoFabricacao: anoFabNumerico,
        uf,
        revisao,
        fipe,
        centroCustoId: centroId ? Number(centroId) : null,
      }),
    );
  }

  const classeCampo =
    "h-10 w-full rounded-lg border border-gray-200 px-3 text-xs text-gray-700 outline-none focus:border-blue-500 aria-invalid:border-red-500";

  return (
    <Modal
      titulo={veiculo ? "Editar veículo" : "Novo veículo"}
      subtitulo="Escolha na tabela FIPE para já trazer o valor do carro."
      larguraMax="max-w-lg"
      onClose={onClose}
    >
      <form noValidate onSubmit={handleSubmit}>
        <div className="space-y-4 px-6 py-5">
          <div>
            <label
              htmlFor={idApelido}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Apelido (opcional)
            </label>
            <input
              id={idApelido}
              type="text"
              value={apelido}
              onChange={(event) => setApelido(event.target.value)}
              maxLength={60}
              placeholder="Ex.: Carro da família, Van da entrega"
              className={classeCampo}
            />
          </div>

          <SeletorDeTipo
            valor={tipo}
            onChange={(novo) => {
              // Os códigos da FIPE de um tipo não servem para outro.
              setTipo(novo);
              setFipe({ marcaId: "", modeloId: "", ano: "" });
            }}
          />

          <FipeSeletor
            key={tipo}
            tipo={tipo}
            valor={fipe}
            onChange={(selecao, nomes) => {
              setFipe(selecao);
              if (nomes.marca !== undefined) {
                setMarca(nomes.marca);
                limpar(idMarca);
              }
              if (nomes.modelo !== undefined) {
                setModelo(nomes.modelo);
                limpar(idModelo);
              }
              if (nomes.ano !== undefined) {
                setAno(String(nomes.ano));
                limpar(idAno);
                // O erro do ano de fabricação depende do ano modelo.
                limpar(idAnoFab);
              }
            }}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={idMarca}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Marca
              </label>
              <input
                id={idMarca}
                {...atributos(idMarca)}
                type="text"
                value={marca}
                onChange={(event) => {
                  setMarca(event.target.value);
                  limpar(idMarca);
                }}
                className={classeCampo}
                required
              />
              <ErroDoCampo campo={idMarca} mensagem={erros[idMarca]} />
            </div>
            <div>
              <label
                htmlFor={idModelo}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Modelo
              </label>
              <input
                id={idModelo}
                {...atributos(idModelo)}
                type="text"
                value={modelo}
                onChange={(event) => {
                  setModelo(event.target.value);
                  limpar(idModelo);
                }}
                className={classeCampo}
                required
              />
              <ErroDoCampo campo={idModelo} mensagem={erros[idModelo]} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={idPlaca}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Placa
              </label>
              <input
                id={idPlaca}
                {...atributos(idPlaca, placa ? idAjudaPlaca : undefined)}
                type="text"
                value={placa}
                onChange={(event) => {
                  setPlaca(limparPlaca(event.target.value));
                  limpar(idPlaca);
                }}
                maxLength={8}
                placeholder="ABC1D23 ou ABC1234"
                autoCapitalize="characters"
                className={`${classeCampo} font-semibold uppercase tracking-wider`}
                required
              />
              <ErroDoCampo campo={idPlaca} mensagem={erros[idPlaca]} />
              {placa && (
                <p
                  id={idAjudaPlaca}
                  className={`mt-1 text-xs ${
                    placaValida(placa) ? "text-emerald-700" : "text-gray-500"
                  }`}
                >
                  {placaValida(placa)
                    ? ROTULO_PADRAO[padraoDaPlaca(placa)!]
                    : "Use 3 letras e 4 números (ABC1234) ou o padrão Mercosul (ABC1D23)."}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor={idAno}
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Ano modelo
              </label>
              <input
                id={idAno}
                {...atributos(idAno, idAjudaAno)}
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={ano}
                onChange={(event) => {
                  setAno(event.target.value);
                  limpar(idAno);
                  limpar(idAnoFab);
                }}
                className={classeCampo}
                required
              />
              <ErroDoCampo campo={idAno} mensagem={erros[idAno]} />
              <p id={idAjudaAno} className="mt-1 text-xs text-gray-500">
                Ano do modelo (o mesmo da tabela FIPE). Pode ser o ano seguinte ao de fabricação.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor={idAnoFab}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Ano de fabricação (opcional)
            </label>
            <input
              id={idAnoFab}
              {...atributos(idAnoFab, idAjudaAnoFab)}
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={anoFab}
              placeholder="Ex.: 2018"
              onChange={(event) => {
                setAnoFab(event.target.value);
                limpar(idAnoFab);
              }}
              className={classeCampo}
            />
            <ErroDoCampo campo={idAnoFab} mensagem={erros[idAnoFab]} />
            <p id={idAjudaAnoFab} className="mt-1 text-xs text-gray-500">
              Se for diferente do ano modelo, informe (como no documento: 2018/2019). Só pode ser igual ao ano modelo ou um ano antes.
            </p>
          </div>

          <div>
            <label
              htmlFor={idUf}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Estado de emplacamento
            </label>
            <select
              id={idUf}
              value={uf}
              onChange={(event) => setUf(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-500 aria-invalid:border-red-500"
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
            <label
              htmlFor={idRevisao}
              className="mb-1.5 block text-xs font-medium text-gray-700"
            >
              Próxima revisão (opcional)
            </label>
            <input
              id={idRevisao}
              aria-describedby={idAjudaRevisao}
              type="date"
              value={revisao}
              onChange={(event) => setRevisao(event.target.value)}
              className={classeCampo}
            />
            <p id={idAjudaRevisao} className="mt-1 text-xs text-gray-500">
              Avisamos por e-mail quando faltar até 30 dias.
            </p>
          </div>

          {centros && (
            <div>
              <label
                htmlFor="veiculo-centro"
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Centro de custo padrão (opcional)
              </label>
              <select
                id="veiculo-centro"
                value={centroId}
                onChange={(event) => setCentroId(event.target.value)}
                className={classeCampo}
              >
                <option value="">Nenhum</option>
                {centros.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Vale nas reservas que não escolherem outro centro.
              </p>
            </div>
          )}
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
            disabled={enviando}
            className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando
              ? "Salvando..."
              : veiculo
                ? "Salvar alterações"
                : "Cadastrar veículo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
