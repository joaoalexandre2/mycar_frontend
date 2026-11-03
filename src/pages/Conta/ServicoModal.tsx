import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { FileText, Paperclip, Plus, Trash2, Wrench } from "lucide-react";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { servicoService } from "../../services/conta";
import { SeletorDeVeiculo } from "../../components/conta/SeletorDeVeiculo";
import { mensagemErro } from "../../services/api";
import { Modal } from "../../components/ui/Modal";
import { lerInteiroBR, lerNumeroBR } from "../../utils/numero";
import { formatarMoeda, hojeISO } from "../../utils/formatters";
import type {
  AnexoDoServico,
  NaturezaServico,
  NovaPecaDoServico,
  NovoServico,
  Servico,
  ServicosDaConta,
  VeiculoConta,
} from "../../types/conta";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

/** Sugestões de aviso por tipo (o usuário pode trocar). */
const SUGESTAO: Record<string, { meses: string; km: string }> = {
  oleo: { meses: "6", km: "10000" },
  bateria: { meses: "24", km: "" },
  palhetas: { meses: "12", km: "" },
  filtros: { meses: "12", km: "10000" },
  pneus: { meses: "", km: "40000" },
  freios: { meses: "", km: "30000" },
  alinhamento: { meses: "6", km: "10000" },
  correia: { meses: "", km: "60000" },
};

const OPCOES_MESES = [
  { valor: "", texto: "Sem aviso por prazo" },
  { valor: "3", texto: "3 meses" },
  { valor: "6", texto: "6 meses" },
  { valor: "12", texto: "12 meses" },
  { valor: "24", texto: "24 meses" },
];

const OPCOES_NATUREZA: { valor: NaturezaServico | ""; texto: string }[] = [
  { valor: "", texto: "Não informar" },
  { valor: "preventiva", texto: "Preventiva (planejada)" },
  { valor: "corretiva", texto: "Corretiva (quebrou ou falhou)" },
];

/** Peça enquanto o formulário está aberto: os números ficam como o usuário digita. */
interface PecaEmEdicao {
  chave: number;
  descricao: string;
  quantidade: string;
  valorUnitario: string;
}

function campoNumero(valor: number | null) {
  return valor === null ? "" : String(valor).replace(".", ",");
}

function campoInteiro(valor: number | null) {
  return valor === null ? "" : String(valor);
}

function numeroOuZero(texto: string) {
  const lido = lerNumeroBR(texto);
  return lido.estado === "ok" ? lido.valor : 0;
}

function centavos(valor: number) {
  return Math.round(valor * 100) / 100;
}

interface ServicoModalProps {
  /** Serviço a editar; nulo para registrar um novo. */
  servico: Servico | null;
  veiculoInicial: VeiculoConta | null;
  tipos: ServicosDaConta["tipos"];
  onClose: () => void;
  onSalvo: (dados: ServicosDaConta) => void;
  /** Nota fiscal enviada ou removida: a lista da tela precisa ser atualizada. */
  onAnexosMudaram: () => void;
}

export function ServicoModal({
  servico,
  veiculoInicial,
  tipos,
  onClose,
  onSalvo,
  onAnexosMudaram,
}: ServicoModalProps) {
  const pedirConfirmacao = useConfirmar();
  const entradaArquivo = useRef<HTMLInputElement>(null);
  const proximaChave = useRef(servico?.pecas.length ?? 0);

  const [veiculoId, setVeiculoId] = useState(String(servico?.veiculoContaId ?? veiculoInicial?.id ?? ""));
  const [tipo, setTipo] = useState(servico?.tipo ?? "oleo");
  const [titulo, setTitulo] = useState(servico?.titulo ?? "");
  const [realizadoEm, setRealizadoEm] = useState(servico?.realizadoEm ?? hojeISO());
  const [km, setKm] = useState(campoInteiro(servico?.km ?? null));
  const [natureza, setNatureza] = useState<NaturezaServico | "">(servico?.natureza ?? "");
  const [oficina, setOficina] = useState(servico?.oficina ?? "");
  const [pecas, setPecas] = useState<PecaEmEdicao[]>(() =>
    (servico?.pecas ?? []).map((peca, indice) => ({
      chave: indice + 1,
      descricao: peca.descricao,
      quantidade: campoNumero(peca.quantidade),
      valorUnitario: campoNumero(peca.valorUnitario),
    })),
  );
  const [maoDeObra, setMaoDeObra] = useState(campoNumero(servico?.valorMaoDeObra ?? null));
  const [valor, setValor] = useState(campoNumero(servico?.valor ?? null));
  const [observacoes, setObservacoes] = useState(servico?.observacoes ?? "");
  const [meses, setMeses] = useState(servico ? String(servico.intervaloMeses ?? "") : SUGESTAO.oleo.meses);
  const [intervaloKm, setIntervaloKm] = useState(
    servico ? campoInteiro(servico.intervaloKm) : SUGESTAO.oleo.km,
  );
  const [anexos, setAnexos] = useState<AnexoDoServico[]>(servico?.anexos ?? []);
  const [erro, setErro] = useState<string | null>(null);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);

  // Com peças ou mão de obra, o total é a soma delas; senão, vale o valor digitado.
  const dividido = pecas.length > 0 || maoDeObra.trim() !== "";
  const totalDoFormulario = centavos(
    pecas.reduce(
      (soma, peca) => soma + numeroOuZero(peca.quantidade) * numeroOuZero(peca.valorUnitario),
      numeroOuZero(maoDeObra),
    ),
  );

  function escolherTipo(novo: string) {
    setTipo(novo);
    const sugestao = SUGESTAO[novo] ?? { meses: "", km: "" };
    setMeses(sugestao.meses);
    setIntervaloKm(sugestao.km);
  }

  function adicionarPeca() {
    proximaChave.current += 1;
    setPecas((atuais) => [
      ...atuais,
      { chave: proximaChave.current, descricao: "", quantidade: "1", valorUnitario: "" },
    ]);
  }

  function alterarPeca(chave: number, campo: keyof Omit<PecaEmEdicao, "chave">, novo: string) {
    setPecas((atuais) => atuais.map((peca) => (peca.chave === chave ? { ...peca, [campo]: novo } : peca)));
  }

  function removerPeca(chave: number) {
    setPecas((atuais) => atuais.filter((peca) => peca.chave !== chave));
  }

  async function anexar(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!arquivo || !servico) return;

    setErroAnexo(null);
    setEnviandoAnexo(true);

    try {
      const novo = await servicoService.anexar(servico.id, arquivo);
      setAnexos((atuais) => [...atuais, novo]);
      onAnexosMudaram();
    } catch (error) {
      setErroAnexo(mensagemErro(error));
    } finally {
      setEnviandoAnexo(false);
    }
  }

  async function removerAnexo(anexo: AnexoDoServico) {
    if (!(await pedirConfirmacao({
      mensagem: `Remover "${anexo.nome}" deste serviço?`,
      confirmarTexto: "Remover",
      perigo: true,
    }))) return;

    setErroAnexo(null);

    try {
      await servicoService.removerAnexo(anexo.id);
      setAnexos((atuais) => atuais.filter((item) => item.id !== anexo.id));
      onAnexosMudaram();
    } catch (error) {
      setErroAnexo(mensagemErro(error));
    }
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setErro(null);

    const kmLido = lerInteiroBR(km);
    const intervaloLido = lerInteiroBR(intervaloKm);
    const valorLido = lerNumeroBR(valor);
    const maoDeObraLida = lerNumeroBR(maoDeObra);

    if (kmLido.estado === "invalido") {
      setErro("Km do veículo inválido: use só números, como 52300 ou 52.300.");
      return;
    }

    if (intervaloLido.estado === "invalido") {
      setErro("Intervalo em km inválido: use só números, como 10000 ou 10.000.");
      return;
    }

    if (valorLido.estado === "invalido") {
      setErro("Valor pago inválido: use o formato 1.234,56.");
      return;
    }

    if (maoDeObraLida.estado === "invalido") {
      setErro("Mão de obra inválida: use o formato 1.234,56.");
      return;
    }

    const pecasLidas: NovaPecaDoServico[] = [];

    for (const peca of pecas) {
      const nome = peca.descricao.trim();
      const quantidade = lerNumeroBR(peca.quantidade);
      const valorUnitario = lerNumeroBR(peca.valorUnitario);

      if (!nome) {
        setErro("Informe o nome de cada peça ou remova a linha em branco.");
        return;
      }

      if (quantidade.estado !== "ok" || quantidade.valor <= 0) {
        setErro(`Quantidade inválida em "${nome}".`);
        return;
      }

      if (valorUnitario.estado !== "ok") {
        setErro(`Preço inválido em "${nome}": use o formato 1.234,56.`);
        return;
      }

      pecasLidas.push({
        descricao: nome,
        quantidade: quantidade.valor,
        valor_unitario: valorUnitario.valor,
      });
    }

    const kmNumero = kmLido.estado === "ok" ? kmLido.valor : null;
    const intervaloNumero = intervaloLido.estado === "ok" ? intervaloLido.valor : null;
    const maoDeObraNumero = maoDeObraLida.estado === "ok" ? maoDeObraLida.valor : null;

    let valorNumero = valorLido.estado === "ok" ? valorLido.valor : null;

    if (pecasLidas.length > 0 || maoDeObraNumero !== null) {
      valorNumero = centavos(
        pecasLidas.reduce((soma, peca) => soma + peca.quantidade * peca.valor_unitario, 0) +
          (maoDeObraNumero ?? 0),
      );
    }

    if (!veiculoId) {
      setErro("Escolha o veículo.");
      return;
    }

    if (tipo === "outro" && !titulo.trim()) {
      setErro("Informe o nome do serviço.");
      return;
    }

    if (intervaloNumero && kmNumero === null) {
      setErro("Informe o km do veículo hoje para avisar por quilometragem.");
      return;
    }

    const dados: NovoServico = {
      veiculo_conta_id: Number(veiculoId),
      tipo,
      titulo: tipo === "outro" ? titulo.trim() : null,
      realizado_em: realizadoEm,
      km: kmNumero,
      valor: valorNumero,
      observacoes: observacoes.trim() || null,
      intervalo_meses: meses ? Number(meses) : null,
      intervalo_km: intervaloNumero,
      natureza: natureza || null,
      oficina: oficina.trim() || null,
      valor_mao_obra: maoDeObraNumero,
      pecas: pecasLidas,
    };

    try {
      setSalvando(true);
      onSalvo(
        servico
          ? await servicoService.atualizar(servico.id, dados)
          : await servicoService.registrar(dados),
      );
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={servico ? "Editar serviço" : "Novo serviço"}
      icone={<Wrench size={16} className="text-blue-600" />}
      larguraMax="max-w-xl"
      onClose={onClose}
    >
      <form onSubmit={(e) => void salvar(e)}>
        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {servico ? (
              <div className="block text-xs text-gray-500">
                Veículo
                <p className="mt-1 flex h-10 items-center text-xs text-gray-700">
                  {[servico.veiculo, servico.placa].filter(Boolean).join(" · ")}
                </p>
              </div>
            ) : (
              <div className="block text-xs text-gray-500">
                Veículo
                <div className="mt-1">
                  <SeletorDeVeiculo
                    valor={veiculoId}
                    veiculoEscolhido={veiculoInicial}
                    aoMudar={(id) => setVeiculoId(id)}
                  />
                </div>
              </div>
            )}

            <label className="block text-xs text-gray-500">
              Serviço
              <select
                value={tipo}
                onChange={(e) => escolherTipo(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              >
                {tipos.map((t) => (
                  <option key={t.tipo} value={t.tipo}>
                    {t.rotulo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {tipo === "outro" && (
            <label className="block text-xs text-gray-500">
              Nome do serviço
              <input
                type="text"
                value={titulo}
                maxLength={80}
                placeholder="Ex.: Pastilhas de freio"
                onChange={(e) => setTitulo(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              />
            </label>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs text-gray-500">
              Preventiva ou corretiva
              <select
                value={natureza}
                onChange={(e) => setNatureza(e.target.value as NaturezaServico | "")}
                className={`mt-1 ${classeCampo}`}
              >
                {OPCOES_NATUREZA.map((o) => (
                  <option key={o.valor} value={o.valor}>
                    {o.texto}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-gray-500">
              Oficina (opcional)
              <input
                type="text"
                value={oficina}
                maxLength={80}
                placeholder="Ex.: Oficina do João"
                onChange={(e) => setOficina(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs text-gray-500">
              Feito em
              <input
                type="date"
                value={realizadoEm}
                max={hojeISO()}
                onChange={(e) => setRealizadoEm(e.target.value)}
                className={`mt-1 ${classeCampo}`}
                required
              />
            </label>
            <label className="block text-xs text-gray-500">
              Km do veículo
              <input
                type="text"
                inputMode="numeric"
                value={km}
                placeholder="Ex.: 52300"
                onChange={(e) => setKm(e.target.value)}
                className={`mt-1 ${classeCampo}`}
              />
            </label>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-700">Peças</p>
              <button
                type="button"
                onClick={adicionarPeca}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus size={13} /> Adicionar peça
              </button>
            </div>

            {pecas.length === 0 && (
              <p className="text-xs text-gray-500">
                Sem peças. Informe as peças se quiser separar o custo delas da mão de obra.
              </p>
            )}

            {pecas.map((peca) => (
              <div
                key={peca.chave}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_5rem_7rem_auto] sm:items-end"
              >
                <label className="block text-xs text-gray-500">
                  Peça
                  <input
                    type="text"
                    value={peca.descricao}
                    maxLength={120}
                    placeholder="Ex.: Filtro de ar"
                    onChange={(e) => alterarPeca(peca.chave, "descricao", e.target.value)}
                    className={`mt-1 ${classeCampo}`}
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Qtd.
                  <input
                    type="text"
                    inputMode="decimal"
                    value={peca.quantidade}
                    onChange={(e) => alterarPeca(peca.chave, "quantidade", e.target.value)}
                    className={`mt-1 ${classeCampo}`}
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Preço unit. (R$)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={peca.valorUnitario}
                    onChange={(e) => alterarPeca(peca.chave, "valorUnitario", e.target.value)}
                    className={`mt-1 ${classeCampo}`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removerPeca(peca.chave)}
                  aria-label={`Remover peça ${peca.descricao || "em branco"}`}
                  title="Remover peça"
                  className="flex h-10 items-center justify-center px-2 text-gray-500 transition hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs text-gray-500">
                Mão de obra (R$)
                <input
                  type="text"
                  inputMode="decimal"
                  value={maoDeObra}
                  onChange={(e) => setMaoDeObra(e.target.value)}
                  className={`mt-1 ${classeCampo}`}
                />
              </label>

              {dividido ? (
                <p className="self-end pb-2 text-xs text-gray-700">
                  Total do serviço:{" "}
                  <span className="font-semibold">{formatarMoeda(totalDoFormulario)}</span>
                </p>
              ) : (
                <label className="block text-xs text-gray-500">
                  Valor pago (R$)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className={`mt-1 ${classeCampo}`}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-700">
              Avisar a próxima troca
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs text-gray-500">
                Por prazo
                <select
                  value={meses}
                  onChange={(e) => setMeses(e.target.value)}
                  className={`mt-1 ${classeCampo}`}
                >
                  {OPCOES_MESES.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.texto}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-gray-500">
                Por quilometragem (a cada)
                <input
                  type="text"
                  inputMode="numeric"
                  value={intervaloKm}
                  placeholder="Ex.: 10000 km"
                  onChange={(e) => setIntervaloKm(e.target.value)}
                  className={`mt-1 ${classeCampo}`}
                />
              </label>
            </div>

            <p className="text-xs text-gray-500">
              Pode usar os dois: avisamos pelo que chegar primeiro, por e-mail,
              30 dias ou 1.000 km antes.
            </p>
          </div>

          <label className="block text-xs text-gray-500">
            Observações (opcional)
            <input
              type="text"
              value={observacoes}
              maxLength={255}
              placeholder="Ex.: óleo 5W30 sintético"
              onChange={(e) => setObservacoes(e.target.value)}
              className={`mt-1 ${classeCampo}`}
            />
          </label>

          {servico && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">Notas fiscais e recibos</p>
                <button
                  type="button"
                  onClick={() => entradaArquivo.current?.click()}
                  disabled={enviandoAnexo}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-60"
                >
                  <Paperclip size={13} /> {enviandoAnexo ? "Enviando..." : "Anexar arquivo"}
                </button>
                <input
                  ref={entradaArquivo}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  aria-label="Anexar nota fiscal ou recibo"
                  onChange={(e) => void anexar(e)}
                />
              </div>

              {anexos.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Nenhum arquivo anexado. Aceita PDF, JPG, PNG ou WEBP de até 8 MB.
                </p>
              ) : (
                <ul className="space-y-2">
                  {anexos.map((anexo) => (
                    <li key={anexo.id} className="flex items-center justify-between gap-2 text-xs">
                      <a
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 items-center gap-2 font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <FileText size={13} className="shrink-0" />
                        <span className="truncate">{anexo.nome}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => void removerAnexo(anexo)}
                        aria-label={`Remover ${anexo.nome}`}
                        title="Remover"
                        className="p-1 text-gray-500 transition hover:text-red-600"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {erroAnexo && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {erroAnexo}
                </p>
              )}
            </div>
          )}

          {erro && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {erro}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar serviço"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
