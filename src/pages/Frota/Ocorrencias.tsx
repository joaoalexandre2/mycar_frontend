import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { OcorrenciaModal } from "../../components/frota/OcorrenciaModal";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { useUsuarioDaFrota } from "../../hooks/usePodeNaFrota";
import { contaService } from "../../services/conta/veiculos";
import { ocorrenciasService } from "../../services/ocorrencias";
import { mensagemErro } from "../../services/api";
import { formatarDataHora, formatarMoeda } from "../../utils/formatters";
import { ehAdministradorOuGestor } from "../../utils/permissoes";
import { STATUS_DE_OCORRENCIA, TIPOS_DE_OCORRENCIA, type FiltroDeOcorrencias, type Ocorrencia, type ResumoDeOcorrencias, type StatusDeOcorrencia, type TipoDeOcorrencia } from "../../types/ocorrencias";
import type { VeiculoConta } from "../../types/conta";

const classeCampo =
  "h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{valor}</p>
    </div>
  );
}

/** Ocorrências da frota: acidentes, avarias e problemas, com o andamento e as fotos. */
export function Ocorrencias() {
  const pedirConfirmacao = useConfirmar();
  const gerencia = ehAdministradorOuGestor(useUsuarioDaFrota());
  const [filtro, setFiltro] = useState<FiltroDeOcorrencias>({});
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [lista, setLista] = useState<Ocorrencia[]>([]);
  const [resumo, setResumo] = useState<ResumoDeOcorrencias | null>(null);
  const [veiculos, setVeiculos] = useState<VeiculoConta[]>([]);
  const [versao, setVersao] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<Ocorrencia | null>(null);
  const [nova, setNova] = useState(false);

  useEffect(() => {
    let ativo = true;

    contaService.listarVeiculos({}).then((p) => {
      if (ativo) setVeiculos(p.dados);
    }).catch(() => {
      if (ativo) setVeiculos([]);
    });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    ocorrenciasService
      .listar(pagina, filtro)
      .then((resultado) => {
        if (!ativo) return;
        setLista(resultado.dados);
        setTotalPaginas(resultado.totalPaginas);
        setResumo(resultado.resumo);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [filtro, pagina, versao]);

  function alterarFiltro(campos: Partial<FiltroDeOcorrencias>) {
    setFiltro((atual) => ({ ...atual, ...campos }));
    setPagina(1);
  }

  async function remover(ocorrencia: Ocorrencia) {
    if (!(await pedirConfirmacao({ mensagem: "Remover esta ocorrência e as fotos dela? A despesa ligada também sai.", confirmarTexto: "Remover", perigo: true }))) return;

    try {
      await ocorrenciasService.remover(ocorrencia.id);
      setVersao((v) => v + 1);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-gray-600">
          Status
          <select aria-label="Filtrar por status" value={filtro.status ?? ""} onChange={(e) => alterarFiltro({ status: (e.target.value || undefined) as StatusDeOcorrencia | undefined })} className={`${classeCampo} mt-1 block w-48`}>
            <option value="">Todos</option>
            {Object.entries(STATUS_DE_OCORRENCIA).map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-600">
          Tipo
          <select aria-label="Filtrar por tipo" value={filtro.tipo ?? ""} onChange={(e) => alterarFiltro({ tipo: (e.target.value || undefined) as TipoDeOcorrencia | undefined })} className={`${classeCampo} mt-1 block w-48`}>
            <option value="">Todos</option>
            {Object.entries(TIPOS_DE_OCORRENCIA).map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-600">
          Veículo
          <select aria-label="Filtrar por veículo" value={filtro.veiculoId ?? ""} onChange={(e) => alterarFiltro({ veiculoId: e.target.value ? Number(e.target.value) : undefined })} className={`${classeCampo} mt-1 block w-56`}>
            <option value="">Todos</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>{v.placa} · {v.marca} {v.modelo}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setNova(true)} className="ml-auto flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
          <Plus size={15} /> Registrar ocorrência
        </button>
      </div>

      {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>}

      {resumo && (
        <section aria-label="Resumo" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicador titulo="Ocorrências" valor={String(resumo.total)} />
          <Indicador titulo="Em aberto" valor={String(resumo.abertas)} />
          {gerencia && resumo.prejuizoTotal !== null && <Indicador titulo="Prejuízo estimado" valor={formatarMoeda(resumo.prejuizoTotal)} />}
          {gerencia && resumo.gastoTotal !== null && <Indicador titulo="Gasto com reparos" valor={formatarMoeda(resumo.gastoTotal)} />}
        </section>
      )}

      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-5 py-2 font-medium">Quando</th>
              <th className="px-3 py-2 font-medium">Veículo</th>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Quem registrou</th>
              <th className="px-3 py-2 font-medium">O que aconteceu</th>
              {gerencia && <th className="px-3 py-2 text-right font-medium">Gasto</th>}
              <th className="px-5 py-2 text-right font-medium"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lista.map((o) => (
              <tr key={o.id}>
                <td className="px-5 py-2">{formatarDataHora(o.dataHora)}</td>
                <td className="px-3 py-2">{o.veiculo?.placa ?? "veículo removido"}</td>
                <td className="px-3 py-2">{o.tipoRotulo}</td>
                <td className="px-3 py-2">{o.statusRotulo}</td>
                <td className="px-3 py-2">{o.motorista?.nome ?? "—"}</td>
                <td className="px-3 py-2">{o.descricao}</td>
                {gerencia && <td className="px-3 py-2 text-right">{o.valorGasto !== null ? formatarMoeda(o.valorGasto) : "—"}</td>}
                <td className="px-5 py-2 text-right">
                  <button type="button" onClick={() => setEditando(o)} aria-label={`Abrir ocorrência de ${formatarDataHora(o.dataHora)}`} className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                    <Pencil size={14} />
                  </button>
                  {gerencia && (
                    <button type="button" onClick={() => void remover(o)} aria-label={`Remover ocorrência de ${formatarDataHora(o.dataHora)}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr><td colSpan={gerencia ? 8 : 7} className="px-5 py-6 text-center text-gray-500">Nenhuma ocorrência com esse filtro.</td></tr>
            )}
          </tbody>
        </table>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
            <button type="button" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1} className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 disabled:opacity-40">
              <ChevronLeft size={14} /> Anterior
            </button>
            <span className="text-xs text-gray-500">Página {pagina} de {totalPaginas}</span>
            <button type="button" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina >= totalPaginas} className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 disabled:opacity-40">
              Próxima <ChevronRight size={14} />
            </button>
          </div>
        )}
      </section>

      {(nova || editando) && (
        <OcorrenciaModal
          ocorrencia={editando}
          veiculos={veiculos}
          gerencia={gerencia}
          onSalva={() => {
            setNova(false);
            setEditando(null);
            setVersao((v) => v + 1);
          }}
          onClose={() => {
            setNova(false);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}
