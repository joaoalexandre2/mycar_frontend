import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useInRouterContext } from "react-router-dom";
import { Building2 } from "lucide-react";
import { Alert } from "../ui/Alert";
import { Modal } from "../ui/Modal";
import { LinhaDeTroca } from "./LinhaDeTroca";
import { usePodeNaFrota, useUsuarioDaFrota } from "../../hooks/usePodeNaFrota";
import { centrosCustoService, motivosTrocaCentroService, usosService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { ehAdministradorOuGestor } from "../../utils/permissoes";
import type { CentroCusto, MotivoTrocaCentro, TrocaDeCentro, UsoVeiculo } from "../../types/frota";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

/** Onde a frota cadastra os motivos: a aba "Motivos de troca" é a primeira da Gestão da frota. */
const ROTA_DOS_MOTIVOS = "/frota/configuracoes";

/**
 * Troca o centro de custo de um uso, mesmo concluído. O motivo vem da lista cadastrada pela frota e o
 * centro anterior fica no histórico, que aparece aqui embaixo.
 */
export function TrocarCentroModal({
  uso,
  onTrocado,
  onClose,
}: {
  uso: UsoVeiculo;
  onTrocado: (uso: UsoVeiculo) => void;
  onClose: () => void;
}) {
  const idSemMotivos = useId();
  const usuario = useUsuarioDaFrota();
  const pode = usePodeNaFrota();
  const [centros, setCentros] = useState<CentroCusto[]>([]);
  const [historico, setHistorico] = useState<TrocaDeCentro[] | null>(null);
  const [erroHistorico, setErroHistorico] = useState(false);
  const [versaoHistorico, setVersaoHistorico] = useState(0);
  const [centroId, setCentroId] = useState("");
  // null enquanto carrega: só com a resposta dá para dizer que não há motivo cadastrado.
  const [motivos, setMotivos] = useState<MotivoTrocaCentro[] | null>(null);
  const [motivoId, setMotivoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const semMotivos = motivos?.length === 0;
  // A Gestão da frota é só de administrador e gestor (FrotaGestorRoute); fora de um AuthProvider não esconde.
  const podeCadastrarMotivos = !usuario || (ehAdministradorOuGestor(usuario) && pode("centros_custo"));
  const centroNovo = centros.find((c) => String(c.id) === centroId);

  useEffect(() => {
    let ativo = true;

    centrosCustoService
      .listar()
      .then((dados) => {
        if (ativo) setCentros(dados);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    motivosTrocaCentroService
      .listar()
      .then((dados) => {
        if (ativo) setMotivos(dados);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [uso.id]);

  useEffect(() => {
    let ativo = true;

    usosService
      .historicoDeCentros(uso.id)
      .then((dados) => {
        if (!ativo) return;
        setHistorico(dados);
        setErroHistorico(false);
      })
      .catch(() => {
        if (ativo) setErroHistorico(true);
      });

    return () => {
      ativo = false;
    };
  }, [uso.id, versaoHistorico]);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (semMotivos) return;

    if (!centroId) {
      setErro("Escolha o novo centro de custo.");
      return;
    }

    if (!motivoId) {
      setErro("Escolha o motivo da troca.");
      return;
    }

    try {
      setSalvando(true);
      onTrocado(await usosService.trocarCentro(uso.id, Number(centroId), Number(motivoId)));
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Trocar centro de custo" subtitulo={`Atual: ${uso.centroCusto ?? "sem centro"}`} icone={<Building2 size={16} />} onClose={onClose}>
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="tc-centro" className={rotulo}>Novo centro de custo</label>
          <select id="tc-centro" value={centroId} onChange={(e) => setCentroId(e.target.value)} className={classeCampo} autoFocus>
            <option value="">Escolha...</option>
            {centros
              .filter((c) => c.id !== uso.centroCustoId)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="tc-motivo" className={rotulo}>Motivo</label>
          <select id="tc-motivo" value={motivoId} onChange={(e) => setMotivoId(e.target.value)} className={classeCampo}>
            <option value="">Escolha...</option>
            {(motivos ?? []).map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
          {semMotivos && (
            <Alert tone="warning" id={idSemMotivos} className="mt-2">
              <p>
                A troca precisa de um motivo, e a frota ainda não tem nenhum cadastrado.
                {podeCadastrarMotivos
                  ? " Cadastre os motivos em Gestão da frota e volte para trocar."
                  : " Peça a um administrador ou gestor da frota para cadastrar em Gestão da frota > Motivos de troca."}
              </p>
              {podeCadastrarMotivos && <LinkParaMotivos />}
            </Alert>
          )}
        </div>

        {centroNovo && (
          <Alert tone="info">
            Centro de custo: de <strong>{uso.centroCusto ?? "sem centro"}</strong> para <strong>{centroNovo.nome}</strong>
          </Alert>
        )}

        {erro && (
          <Alert tone="danger">{erro}</Alert>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando || semMotivos}
            aria-describedby={semMotivos ? idSemMotivos : undefined}
            className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Trocar centro"}
          </button>
        </div>

        {erroHistorico && (
          <Alert tone="warning" action={{ label: "Tentar de novo", onClick: () => setVersaoHistorico((v) => v + 1) }}>
            Não foi possível carregar as trocas anteriores deste uso. A troca continua possível.
          </Alert>
        )}

        {!erroHistorico && historico && historico.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Trocas anteriores</p>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {historico.map((t) => (
                <LinhaDeTroca key={t.id} troca={t} />
              ))}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  );
}

/** Link para a tela dos motivos; fora de um roteador (testes isolados), um link comum. */
function LinkParaMotivos() {
  const emRoteador = useInRouterContext();
  const classe = "mt-1 inline-flex h-11 items-center font-semibold underline md:h-auto";
  const texto = "Ir para Motivos de troca";

  if (!emRoteador) {
    return <a href={ROTA_DOS_MOTIVOS} className={classe}>{texto}</a>;
  }

  return <Link to={ROTA_DOS_MOTIVOS} className={classe}>{texto}</Link>;
}
