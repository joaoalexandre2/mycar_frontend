import { useEffect, useState, type FormEvent } from "react";
import { FileWarning, Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { contaService } from "../../services/conta/veiculos";
import { motoristasService } from "../../services/frota";
import { multasService } from "../../services/frotaDiferenciais";
import { mensagemErro } from "../../services/api";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { formatarDataHora } from "../../utils/formatters";
import type { Motorista } from "../../types/frota";
import type { Multa, SugestaoDeResponsavel } from "../../types/frota";
import type { VeiculoConta } from "../../types/conta";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

const SITUACOES: { valor: Multa["situacao"]; texto: string }[] = [
  { valor: "aberta", texto: "Aberta" },
  { valor: "paga", texto: "Paga" },
  { valor: "recorrida", texto: "Recorrida" },
];

/** Multas da frota, cada uma com o responsável (a reserva e o motorista da data e hora). */
export function Multas() {
  const pedirConfirmacao = useConfirmar();
  const [multas, setMultas] = useState<Multa[] | null>(null);
  const [situacao, setSituacao] = useState("");
  const [versao, setVersao] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [nova, setNova] = useState(false);

  useEffect(() => {
    let ativo = true;

    multasService
      .listar({ situacao: situacao || undefined })
      .then((lista) => {
        if (!ativo) return;
        setMultas(lista);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [situacao, versao]);

  async function mudarSituacao(multa: Multa, valor: Multa["situacao"]) {
    try {
      await multasService.atualizar(multa.id, { situacao: valor });
      setVersao((v) => v + 1);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function remover(multa: Multa) {
    if (!(await pedirConfirmacao({ mensagem: `Remover a multa de ${formatarDataHora(multa.data_hora)}?`, confirmarTexto: "Remover", perigo: true }))) return;

    try {
      await multasService.remover(multa.id);
      setVersao((v) => v + 1);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Multas da frota</h2>
          <p className="mt-1 text-sm text-gray-500">Cada multa aponta quem estava com o veículo na data e hora da infração.</p>
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="Filtrar por situação" value={situacao} onChange={(e) => setSituacao(e.target.value)} className={`${classeCampo} w-40`}>
            <option value="">Todas</option>
            {SITUACOES.map((s) => (
              <option key={s.valor} value={s.valor}>{s.texto}</option>
            ))}
          </select>
          <button type="button" onClick={() => setNova(true)} className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
            <Plus size={15} /> Nova multa
          </button>
        </div>
      </div>

      {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>}

      {multas && multas.length === 0 && (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">Nenhuma multa registrada.</p>
      )}

      {multas && multas.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {multas.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  <FileWarning size={14} className="mr-1 inline text-amber-600" />
                  {m.descricao}
                </p>
                <p className="text-xs text-gray-500">
                  {formatarDataHora(m.data_hora)} · {m.veiculo ? `${m.veiculo.placa} (${m.veiculo.nome})` : "veículo removido"}
                </p>
                <p className="text-xs text-gray-600">
                  Responsável: {m.motorista ? m.motorista.nome : "não identificado"}
                  {m.valor !== null && ` · R$ ${Number(m.valor).toFixed(2).replace(".", ",")}`}
                  {m.pontos !== null && ` · ${m.pontos} pontos`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label={`Situação da multa de ${formatarDataHora(m.data_hora)}`}
                  value={m.situacao}
                  onChange={(e) => void mudarSituacao(m, e.target.value as Multa["situacao"])}
                  className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700"
                >
                  {SITUACOES.map((s) => (
                    <option key={s.valor} value={s.valor}>{s.texto}</option>
                  ))}
                </select>
                <button type="button" onClick={() => void remover(m)} aria-label={`Remover a multa de ${formatarDataHora(m.data_hora)}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {nova && (
        <NovaMulta
          onSalva={() => {
            setNova(false);
            setVersao((v) => v + 1);
          }}
          onClose={() => setNova(false)}
        />
      )}
    </div>
  );
}

function NovaMulta({ onSalva, onClose }: { onSalva: () => void; onClose: () => void }) {
  const [veiculos, setVeiculos] = useState<VeiculoConta[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculoId, setVeiculoId] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [pontos, setPontos] = useState("");
  const [motoristaId, setMotoristaId] = useState("");
  const [sugestao, setSugestao] = useState<SugestaoDeResponsavel | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  // A sugestão só vale enquanto o veículo e a data escolhidos são os que ela respondeu.
  const sugestaoVisivel = veiculoId && dataHora ? sugestao : null;

  useEffect(() => {
    contaService.listarVeiculos({}).then((p) => setVeiculos(p.dados)).catch(() => setVeiculos([]));
    motoristasService.listar().then(setMotoristas).catch(() => setMotoristas([]));
  }, []);

  // Assim que a data e o veículo estão escolhidos, mostra quem estava com o carro naquele momento.
  useEffect(() => {
    if (!veiculoId || !dataHora) return;

    let ativo = true;

    multasService
      .sugerirResponsavel(Number(veiculoId), dataHora)
      .then((s) => {
        if (ativo) setSugestao(s);
      })
      .catch(() => {
        if (ativo) setSugestao(null);
      });

    return () => {
      ativo = false;
    };
  }, [veiculoId, dataHora]);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!veiculoId || !dataHora || !descricao.trim()) {
      setErro("Informe o veículo, a data e hora e a descrição da infração.");
      return;
    }

    try {
      setSalvando(true);
      await multasService.criar({
        veiculo_conta_id: Number(veiculoId),
        data_hora: dataHora,
        descricao: descricao.trim(),
        valor: valor ? Number(valor.replace(",", ".")) : null,
        pontos: pontos ? Number(pontos) : null,
        motorista_id: motoristaId ? Number(motoristaId) : null,
      });
      onSalva();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Nova multa" icone={<FileWarning size={16} />} onClose={onClose} larguraMax="max-w-lg">
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="multa-veiculo" className={rotulo}>Veículo</label>
          <select id="multa-veiculo" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} className={classeCampo}>
            <option value="">Escolha...</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>{v.placa} · {v.marca} {v.modelo}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="multa-data" className={rotulo}>Data e hora da infração</label>
          <input id="multa-data" type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} className={classeCampo} />
        </div>

        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700">
          {sugestaoVisivel?.motorista
            ? <>Responsável sugerido: <span className="font-semibold">{sugestaoVisivel.motorista.nome}</span>{sugestaoVisivel.uso?.finalidade ? ` (${sugestaoVisivel.uso.finalidade})` : ""}</>
            : sugestaoVisivel
              ? "Nenhuma reserva com esse veículo nessa hora. Você pode escolher o responsável abaixo."
              : "Escolha o veículo e a data e hora para ver quem estava com ele."}
        </div>

        <div>
          <label htmlFor="multa-motorista" className={rotulo}>Responsável (opcional, substitui a sugestão)</label>
          <select id="multa-motorista" value={motoristaId} onChange={(e) => setMotoristaId(e.target.value)} className={classeCampo}>
            <option value="">Usar a sugestão</option>
            {motoristas.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="multa-descricao" className={rotulo}>Infração</label>
          <input id="multa-descricao" type="text" maxLength={160} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: excesso de velocidade" className={classeCampo} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="multa-valor" className={rotulo}>Valor (R$)</label>
            <input id="multa-valor" type="text" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="multa-pontos" className={rotulo}>Pontos</label>
            <input id="multa-pontos" type="number" min={0} max={40} value={pontos} onChange={(e) => setPontos(e.target.value)} className={classeCampo} />
          </div>
        </div>

        {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {salvando ? "Salvando..." : "Registrar multa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
