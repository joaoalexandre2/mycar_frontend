import { useEffect, useState } from "react";
import { LinhaDeTroca } from "../../components/frota/LinhaDeTroca";
import { Alert } from "../../components/ui/Alert";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { centrosCustoService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import type { CentroCusto, TrocaDeCentro } from "../../types/frota";
import { classeDoCampo, classeDoRotulo } from "../../components/ui/Campo";

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
          <label htmlFor="hc-de" className={classeDoRotulo}>De</label>
          <input id="hc-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} className={classeDoCampo} />
        </div>
        <div>
          <label htmlFor="hc-ate" className={classeDoRotulo}>Até</label>
          <input id="hc-ate" type="date" value={ate} min={de || undefined} onChange={(e) => setAte(e.target.value)} className={classeDoCampo} />
        </div>
        <div>
          <label htmlFor="hc-centro" className={classeDoRotulo}>Centro de custo</label>
          <select id="hc-centro" value={centroId} onChange={(e) => setCentroId(e.target.value)} className={classeDoCampo}>
            <option value="">Todos</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {erro && (
        <Alert tone="danger">{erro}</Alert>
      )}

      {trocas && trocas.length === 0 && (
        <EstadoVazio titulo="Nenhuma troca de centro de custo no período." />
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
