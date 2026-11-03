import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { CategoriasDespesaModal } from "../../components/frota/CategoriasDespesaModal";
import { DespesaAvulsaModal } from "../../components/frota/DespesaAvulsaModal";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { contaService } from "../../services/conta/veiculos";
import { motoristasService, centrosCustoService } from "../../services/frota";
import { categoriasDeDespesaService, despesasAvulsasService, financeiroService } from "../../services/financeiro";
import { mensagemErro } from "../../services/api";
import { dataISOLocal, formatarData, formatarMoeda } from "../../utils/formatters";
import type { CategoriaDeDespesa, DespesaAvulsa, FiltroFinanceiro, ResumoFinanceiro } from "../../types/financeiro";
import type { Motorista } from "../../types/frota";
import type { VeiculoConta } from "../../types/conta";

const classeCampo =
  "h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

/** Primeiro dia do mês atual, em dias de Brasília. */
function inicioDoMes(): string {
  const agora = new Date();

  return dataISOLocal(new Date(agora.getFullYear(), agora.getMonth(), 1));
}

/** "2026-03" → "03/2026". */
function rotuloDoMes(mes: string): string {
  const [ano, numero] = mes.split("-");

  return `${numero}/${ano}`;
}

function Indicador({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="mt-1 text-lg font-bold text-gray-900">{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-gray-500">{detalhe}</p>}
    </div>
  );
}

/** Gestão financeira da frota: quanto cada veículo, motorista e centro custou no período. */
export function Financeiro() {
  const pedirConfirmacao = useConfirmar();
  const [filtro, setFiltro] = useState<FiltroFinanceiro>({ de: inicioDoMes(), ate: dataISOLocal() });
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [despesas, setDespesas] = useState<DespesaAvulsa[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [categorias, setCategorias] = useState<CategoriaDeDespesa[]>([]);
  const [veiculos, setVeiculos] = useState<VeiculoConta[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [centros, setCentros] = useState<{ id: number; nome: string }[]>([]);
  const [versao, setVersao] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [novaDespesa, setNovaDespesa] = useState(false);
  const [editando, setEditando] = useState<DespesaAvulsa | null>(null);
  const [categoriasAbertas, setCategoriasAbertas] = useState(false);

  useEffect(() => {
    let ativo = true;

    Promise.all([
      categoriasDeDespesaService.listar(),
      contaService.listarVeiculos({}),
      motoristasService.listar(),
      centrosCustoService.listar(),
    ])
      .then(([cats, veic, mots, cents]) => {
        if (!ativo) return;
        setCategorias(cats);
        setVeiculos(veic.dados);
        setMotoristas(mots);
        setCentros(cents);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  useEffect(() => {
    let ativo = true;

    Promise.all([financeiroService.resumo(filtro), despesasAvulsasService.listar(pagina, filtro)])
      .then(([resultadoResumo, lista]) => {
        if (!ativo) return;
        setResumo(resultadoResumo);
        setDespesas(lista.dados);
        setTotalPaginas(lista.totalPaginas);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [filtro, pagina, versao]);

  function alterarFiltro(campos: Partial<FiltroFinanceiro>) {
    setFiltro((atual) => ({ ...atual, ...campos }));
    setPagina(1);
  }

  async function remover(despesa: DespesaAvulsa) {
    if (!(await pedirConfirmacao({ mensagem: `Remover a despesa de ${formatarData(despesa.data)}?`, confirmarTexto: "Remover", perigo: true }))) return;

    try {
      await despesasAvulsasService.remover(despesa.id);
      setVersao((v) => v + 1);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  const ind = resumo?.indicadores;

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-gray-600">
          De
          <input type="date" aria-label="Data inicial" value={filtro.de ?? ""} onChange={(e) => alterarFiltro({ de: e.target.value || undefined })} className={`${classeCampo} mt-1 block`} />
        </label>
        <label className="text-xs text-gray-600">
          Até
          <input type="date" aria-label="Data final" value={filtro.ate ?? ""} onChange={(e) => alterarFiltro({ ate: e.target.value || undefined })} className={`${classeCampo} mt-1 block`} />
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
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setCategoriasAbertas(true)} className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            <Tags size={15} /> Categorias
          </button>
          <button type="button" onClick={() => setNovaDespesa(true)} className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
            <Plus size={15} /> Nova despesa
          </button>
        </div>
      </div>

      {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>}

      {resumo && ind && (
        <>
          <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Indicador titulo="Custo total" valor={formatarMoeda(resumo.total)} />
            <Indicador titulo="Combustível" valor={formatarMoeda(resumo.combustivel.total)} detalhe={`${resumo.combustivel.litros.toLocaleString("pt-BR")} litros`} />
            <Indicador titulo="Manutenção (serviços)" valor={formatarMoeda(resumo.servicos.total)} />
            <Indicador titulo="Despesas avulsas" valor={formatarMoeda(resumo.avulsas.total)} />
            <Indicador titulo="Multas" valor={formatarMoeda(resumo.multas.total)} detalhe={`${resumo.multas.quantidade} multa(s)`} />
            <Indicador titulo="Custo por km" valor={ind.custoPorKm === null ? "—" : formatarMoeda(ind.custoPorKm)} detalhe={`${ind.kmRodados.toLocaleString("pt-BR")} km rodados`} />
            <Indicador titulo="Custo médio por veículo" valor={formatarMoeda(ind.custoMedioPorVeiculo)} />
            <Indicador
              titulo="Maior custo"
              valor={ind.veiculoMaiorCusto ? ind.veiculoMaiorCusto.placa : "—"}
              detalhe={ind.veiculoMaiorCusto ? formatarMoeda(ind.veiculoMaiorCusto.valor) : undefined}
            />
          </section>

          <p className="text-xs text-gray-500">
            Seguro: {formatarMoeda(resumo.seguro.valorAnualTotal)} por ano nas apólices atuais. Fica à parte e não entra no total do período.
          </p>

          <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <h3 className="px-5 pt-4 text-sm font-semibold text-gray-900">Por veículo</h3>
            <table className="mt-3 w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Veículo</th>
                  <th className="px-3 py-2 text-right font-medium">Combustível</th>
                  <th className="px-3 py-2 text-right font-medium">Manutenção</th>
                  <th className="px-3 py-2 text-right font-medium">Avulsas</th>
                  <th className="px-3 py-2 text-right font-medium">Multas</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-right font-medium">Km</th>
                  <th className="px-5 py-2 text-right font-medium">Custo/km</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {resumo.porVeiculo.map((v) => (
                  <tr key={v.veiculoId}>
                    <td className="px-5 py-2"><span className="font-semibold text-gray-900">{v.placa}</span> <span className="text-gray-500">{v.veiculo}</span></td>
                    <td className="px-3 py-2 text-right">{formatarMoeda(v.combustivel)}</td>
                    <td className="px-3 py-2 text-right">{formatarMoeda(v.servicos)}</td>
                    <td className="px-3 py-2 text-right">{formatarMoeda(v.avulsas)}</td>
                    <td className="px-3 py-2 text-right">{formatarMoeda(v.multas)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatarMoeda(v.total)}</td>
                    <td className="px-3 py-2 text-right">{v.kmRodados.toLocaleString("pt-BR")}</td>
                    <td className="px-5 py-2 text-right">{v.custoPorKm === null ? "—" : formatarMoeda(v.custoPorKm)}</td>
                  </tr>
                ))}
                {resumo.porVeiculo.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-6 text-center text-gray-500">Nenhum veículo com gasto no período.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <h3 className="px-5 pt-4 text-sm font-semibold text-gray-900">Por mês</h3>
              <table className="mt-3 w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-5 py-2 font-medium">Mês</th>
                    <th className="px-3 py-2 text-right font-medium">Combustível</th>
                    <th className="px-3 py-2 text-right font-medium">Manutenção</th>
                    <th className="px-3 py-2 text-right font-medium">Avulsas</th>
                    <th className="px-5 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resumo.mensal.map((m) => (
                    <tr key={m.mes}>
                      <td className="px-5 py-2">{rotuloDoMes(m.mes)}</td>
                      <td className="px-3 py-2 text-right">{formatarMoeda(m.combustivel)}</td>
                      <td className="px-3 py-2 text-right">{formatarMoeda(m.servicos)}</td>
                      <td className="px-3 py-2 text-right">{formatarMoeda(m.avulsas + m.multas)}</td>
                      <td className="px-5 py-2 text-right font-semibold">{formatarMoeda(m.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-5 pb-4 pt-2 text-xs text-gray-500">Avulsas inclui as multas.</p>
            </section>

            <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <h3 className="px-5 pt-4 text-sm font-semibold text-gray-900">Por motorista e por centro de custo</h3>
              <table className="mt-3 w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-5 py-2 font-medium">Quem</th>
                    <th className="px-5 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {resumo.porMotorista.map((m) => (
                    <tr key={`m-${m.motoristaId ?? "x"}`}>
                      <td className="px-5 py-2">Motorista: {m.nome}</td>
                      <td className="px-5 py-2 text-right font-semibold">{formatarMoeda(m.total)}</td>
                    </tr>
                  ))}
                  {resumo.porCentro.map((c) => (
                    <tr key={`c-${c.centroCustoId ?? "x"}`}>
                      <td className="px-5 py-2">Centro: {c.nome}</td>
                      <td className="px-5 py-2 text-right font-semibold">{formatarMoeda(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-5 pb-4 pt-2 text-xs text-gray-500">
                Motorista e centro valem para despesas avulsas e multas. Abastecimento e serviço não registram quem dirigiu.
              </p>
            </section>
          </div>
        </>
      )}

      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <h3 className="px-5 pt-4 text-sm font-semibold text-gray-900">Despesas avulsas</h3>
        <table className="mt-3 w-full text-left text-xs">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-5 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Categoria</th>
              <th className="px-3 py-2 font-medium">Veículo</th>
              <th className="px-3 py-2 font-medium">Descrição</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
              <th className="px-5 py-2 text-right font-medium"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {despesas.map((d) => (
              <tr key={d.id}>
                <td className="px-5 py-2">{formatarData(d.data)}</td>
                <td className="px-3 py-2">{d.categoria?.nome ?? "—"}</td>
                <td className="px-3 py-2">{d.veiculo?.placa ?? "—"}</td>
                <td className="px-3 py-2">{d.descricao ?? "—"}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatarMoeda(d.valor)}</td>
                <td className="px-5 py-2 text-right">
                  <button type="button" onClick={() => setEditando(d)} aria-label={`Editar despesa de ${formatarData(d.data)}`} className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => void remover(d)} aria-label={`Remover despesa de ${formatarData(d.data)}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {despesas.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-6 text-center text-gray-500">Nenhuma despesa avulsa no período.</td></tr>
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

      {(novaDespesa || editando) && (
        <DespesaAvulsaModal
          despesa={editando}
          categorias={categorias}
          veiculos={veiculos}
          motoristas={motoristas}
          centros={centros}
          onSalva={() => {
            setNovaDespesa(false);
            setEditando(null);
            setVersao((v) => v + 1);
          }}
          onClose={() => {
            setNovaDespesa(false);
            setEditando(null);
          }}
        />
      )}

      {categoriasAbertas && (
        <CategoriasDespesaModal
          categorias={categorias}
          onAlterou={() => setVersao((v) => v + 1)}
          onClose={() => setCategoriasAbertas(false)}
        />
      )}
    </div>
  );
}
