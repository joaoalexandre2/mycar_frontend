import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import { contaService } from "../../services/conta/veiculos";
import { motoristasService, centrosCustoService } from "../../services/frota";
import { categoriasDeDespesaService } from "../../services/financeiro";
import { relatoriosService, type CatalogoDeRelatorio, type CelulaDeRelatorio, type ColunaDeRelatorio, type FiltroDeRelatorio, type RelatorioGerado } from "../../services/relatorios";
import { mensagemErro } from "../../services/api";
import { dataISOLocal, formatarData, formatarMoeda } from "../../utils/formatters";
import type { CategoriaDeDespesa } from "../../types/financeiro";
import type { Motorista } from "../../types/frota";
import type { VeiculoConta } from "../../types/conta";

const classeCampo =
  "h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

function celula(coluna: ColunaDeRelatorio, valor: CelulaDeRelatorio): string {
  if (valor === null || valor === "") return "—";

  switch (coluna.formato) {
    case "moeda":
      return formatarMoeda(Number(valor));
    case "data":
      return formatarData(String(valor));
    case "numero":
      return Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    case "inteiro":
      return Number(valor).toLocaleString("pt-BR");
    default:
      return String(valor);
  }
}

/** Relatórios gerenciais da frota, com filtros, tela para conferir e CSV para o Excel. */
export function Relatorios() {
  const [catalogo, setCatalogo] = useState<CatalogoDeRelatorio[]>([]);
  const [tipo, setTipo] = useState("utilizacao");
  const [filtro, setFiltro] = useState<FiltroDeRelatorio>({ de: dataISOLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1)), ate: dataISOLocal() });
  const [relatorio, setRelatorio] = useState<RelatorioGerado | null>(null);
  const [veiculos, setVeiculos] = useState<VeiculoConta[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [centros, setCentros] = useState<{ id: number; nome: string }[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDeDespesa[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    relatoriosService.catalogo().then((lista) => {
      if (ativo) setCatalogo(lista);
    }).catch((error) => {
      if (ativo) setErro(mensagemErro(error));
    });

    Promise.all([contaService.listarVeiculos({}), motoristasService.listar(), centrosCustoService.listar(), categoriasDeDespesaService.listar()])
      .then(([veic, mots, cents, cats]) => {
        if (!ativo) return;
        setVeiculos(veic.dados);
        setMotoristas(mots);
        setCentros(cents);
        setCategorias(cats);
      })
      .catch(() => undefined);

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    relatoriosService
      .mostrar(tipo, filtro)
      .then((resultado) => {
        if (!ativo) return;
        setRelatorio(resultado);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [tipo, filtro]);

  async function baixar() {
    try {
      await relatoriosService.baixarCsv(tipo, filtro);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-gray-600">
          Relatório
          <select aria-label="Escolher relatório" value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${classeCampo} mt-1 block w-72`}>
            {catalogo.map((r) => (
              <option key={r.tipo} value={r.tipo}>{r.nome}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-600">
          De
          <input type="date" aria-label="Data inicial" value={filtro.de ?? ""} onChange={(e) => setFiltro((f) => ({ ...f, de: e.target.value || undefined }))} className={`${classeCampo} mt-1 block`} />
        </label>
        <label className="text-xs text-gray-600">
          Até
          <input type="date" aria-label="Data final" value={filtro.ate ?? ""} onChange={(e) => setFiltro((f) => ({ ...f, ate: e.target.value || undefined }))} className={`${classeCampo} mt-1 block`} />
        </label>
        <label className="text-xs text-gray-600">
          Veículo
          <select aria-label="Filtrar por veículo" value={filtro.veiculoId ?? ""} onChange={(e) => setFiltro((f) => ({ ...f, veiculoId: e.target.value ? Number(e.target.value) : undefined }))} className={`${classeCampo} mt-1 block w-48`}>
            <option value="">Todos</option>
            {veiculos.map((v) => (
              <option key={v.id} value={v.id}>{v.placa}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-600">
          Motorista
          <select aria-label="Filtrar por motorista" value={filtro.motoristaId ?? ""} onChange={(e) => setFiltro((f) => ({ ...f, motoristaId: e.target.value ? Number(e.target.value) : undefined }))} className={`${classeCampo} mt-1 block w-44`}>
            <option value="">Todos</option>
            {motoristas.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-gray-600">
          Centro de custo
          <select aria-label="Filtrar por centro de custo" value={filtro.centroCustoId ?? ""} onChange={(e) => setFiltro((f) => ({ ...f, centroCustoId: e.target.value ? Number(e.target.value) : undefined }))} className={`${classeCampo} mt-1 block w-44`}>
            <option value="">Todos</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </label>
        {tipo === "despesas" && (
          <label className="text-xs text-gray-600">
            Categoria (só avulsas)
            <select aria-label="Filtrar por categoria" value={filtro.categoriaId ?? ""} onChange={(e) => setFiltro((f) => ({ ...f, categoriaId: e.target.value ? Number(e.target.value) : undefined }))} className={`${classeCampo} mt-1 block w-44`}>
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </label>
        )}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => void baixar()} className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
            <Download size={15} /> Baixar CSV
          </button>
          <button type="button" onClick={() => window.print()} className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-700 hover:bg-gray-50">
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>

      {erro && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>}

      {relatorio && (
        <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 pt-4">
            <h3 className="text-sm font-semibold text-gray-900">{relatorio.titulo}</h3>
            <span className="text-xs text-gray-500">{relatorio.totalLinhas} registro(s)</span>
          </div>
          <table className="mt-3 w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                {relatorio.colunas.map((c) => (
                  <th key={c.chave} className="px-4 py-2 font-medium">{c.rotulo}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {relatorio.linhas.map((linha, indice) => (
                <tr key={indice}>
                  {relatorio.colunas.map((c) => (
                    <td key={c.chave} className="px-4 py-2">{celula(c, linha[c.chave] ?? null)}</td>
                  ))}
                </tr>
              ))}
              {relatorio.linhas.length === 0 && (
                <tr><td colSpan={relatorio.colunas.length} className="px-5 py-6 text-center text-gray-500">Nenhum registro com esse filtro.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
