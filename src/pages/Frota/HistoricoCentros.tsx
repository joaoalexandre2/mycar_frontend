import { useEffect, useState } from "react";
import { LinhaDeTroca } from "../../components/frota/LinhaDeTroca";
import { centrosCustoService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import type { CentroCusto, TrocaDeCentro } from "../../types/frota";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

/** Relatório das trocas de centro de custo da frota, com filtros por período e centro. */
export function HistoricoCentros() {
  const [centros, setCentros] = useState<CentroCusto[]>([]);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [centroId, setCentroId] = useState("");
  const [trocas, setTrocas] = useState<TrocaDeCentro[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    centrosCustoService
      .listar(true)
      .then((dados) => {
        if (ativo) setCentros(dados);
      })
      .catch(() => {
        // O filtro por centro é opcional: o relatório funciona sem ele.
      });

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    centrosCustoService
      .trocas({ de, ate, centroCustoId: centroId ? Number(centroId) : undefined })
      .then((dados) => {
        if (!ativo) return;
        setTrocas(dados);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [de, ate, centroId]);

  return (
    <section className="space-y-4">
      <p className="text-xs text-gray-500">
        Toda vez que o centro de custo de um uso é trocado, o anterior fica registrado aqui, com quem trocou e o motivo.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="hc-de" className={rotulo}>De</label>
          <input id="hc-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} className={classeCampo} />
        </div>
        <div>
          <label htmlFor="hc-ate" className={rotulo}>Até</label>
          <input id="hc-ate" type="date" value={ate} min={de || undefined} onChange={(e) => setAte(e.target.value)} className={classeCampo} />
        </div>
        <div>
          <label htmlFor="hc-centro" className={rotulo}>Centro de custo</label>
          <select id="hc-centro" value={centroId} onChange={(e) => setCentroId(e.target.value)} className={classeCampo}>
            <option value="">Todos</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {erro && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">{erro}</p>
      )}

      {trocas && trocas.length === 0 && (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
          Nenhuma troca de centro de custo no período.
        </p>
      )}

      {trocas && trocas.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {trocas.map((t) => (
            <LinhaDeTroca key={t.id} troca={t} />
          ))}
        </ul>
      )}
    </section>
  );
}
