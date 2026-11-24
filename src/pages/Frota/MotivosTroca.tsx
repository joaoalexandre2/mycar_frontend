import { useEffect, useState, type FormEvent } from "react";
import { motivosTrocaCentroService } from "../../services/frota";
import { Alert } from "../../components/ui/Alert";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { mensagemErro } from "../../services/api";
import type { MotivoTrocaCentro } from "../../types/frota";
import { classeDoCampo, classeDoRotulo } from "../../components/ui/Campo";

/** Motivos que a frota usa para trocar o centro de custo de um uso. */
export function MotivosTroca() {
  const [motivos, setMotivos] = useState<MotivoTrocaCentro[] | null>(null);
  const [versao, setVersao] = useState(0);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;

    motivosTrocaCentroService
      .listar(true)
      .then((resposta) => {
        if (!ativo) return;
        setMotivos(resposta);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  async function criar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Informe o nome do motivo.");
      return;
    }

    try {
      setSalvando(true);
      await motivosTrocaCentroService.criar(nome.trim());
      setNome("");
      setVersao((v) => v + 1);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(motivo: MotivoTrocaCentro) {
    setErro(null);

    try {
      await motivosTrocaCentroService.atualizar(motivo.id, { ativo: !motivo.ativo });
      setVersao((v) => v + 1);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => void criar(e)} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <div>
          <label htmlFor="mot-nome" className={classeDoRotulo}>Novo motivo</label>
          <input
            id="mot-nome"
            type="text"
            value={nome}
            maxLength={120}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: lançado errado pelo motorista"
            className={classeDoCampo}
          />
        </div>
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white disabled:opacity-60"
        >
          Cadastrar motivo
        </button>
      </form>

      {erro && <Alert tone="danger">{erro}</Alert>}

      {motivos === null && !erro && <Carregando />}

      {motivos && motivos.length === 0 && (
        <EstadoVazio titulo="Nenhum motivo cadastrado ainda." />
      )}

      {motivos && motivos.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {motivos.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <p className={`text-sm ${m.ativo ? "text-gray-900" : "text-gray-400 line-through"}`}>{m.nome}</p>
              <button
                type="button"
                onClick={() => void alternarAtivo(m)}
                className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                {m.ativo ? "Desativar" : "Reativar"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
