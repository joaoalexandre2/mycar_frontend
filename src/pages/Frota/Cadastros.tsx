import { useEffect, useState, type FormEvent } from "react";
import { Building2, History, Pencil, Plus, Send, Trash2, UserRound } from "lucide-react";
import { isAxiosError } from "axios";
import { Abas } from "../../components/ui/Abas";
import { Alert } from "../../components/ui/Alert";
import { StatusChip } from "../../components/ui/StatusChip";
import { Modal } from "../../components/ui/Modal";
import { useCarregarLista } from "../../hooks/useCarregarLista";
import { HistoricoCentros } from "./HistoricoCentros";
import { usePodeNaFrota, usePodeVerMenu } from "../../hooks/usePodeNaFrota";
import { centrosCustoService, motoristasService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { formatarData } from "../../utils/formatters";
import { situacaoDaCnh } from "../../utils/motorista";
import type { CentroCusto, EstadoAcessoMotorista, Motorista } from "../../types/frota";
import { classeDoCampo, classeDoRotulo } from "../../components/ui/Campo";

type Aba = "motoristas" | "centros" | "historico";

/** Motoristas, centros de custo e histórico de trocas. As configurações da frota ficam em outro menu. */
export function Cadastros() {
  const pode = usePodeNaFrota();
  const podeVer = usePodeVerMenu();
  const [aba, setAba] = useState<Aba>("motoristas");

  const abas = (
    [
      { chave: "motoristas", titulo: "Motoristas", icone: UserRound, permissao: "motoristas" },
      { chave: "centros", titulo: "Centros de custo", icone: Building2, permissao: "centros_custo" },
      { chave: "historico", titulo: "Histórico de centros", icone: History, permissao: "centros_custo" },
    ] as const
  ).filter(({ permissao }) => pode(permissao));

  // Sem permissão para a aba escolhida (ou para a inicial), vale a primeira que a pessoa pode ver.
  const atual = abas.some(({ chave }) => chave === aba) ? aba : abas[0]?.chave;

  if (!podeVer("cadastros")) {
    return (
      <div className="p-4 sm:p-8">
        <p className="text-sm text-gray-500">Esta área não está liberada para o seu acesso na frota.</p>
      </div>
    );
  }

  return (
    // O título e o subtítulo da página já estão no cabeçalho (Header): o corpo começa nas abas.
    <div className="space-y-6 p-4 sm:p-8">
      <Abas itens={abas} atual={atual} onMudar={setAba} rotulo="Motoristas e centros de custo">
        {atual === "motoristas" && <Motoristas />}
        {atual === "centros" && <Centros />}
        {atual === "historico" && <HistoricoCentros />}
      </Abas>
    </div>
  );
}

// ------------------------------------------------- remoção recusada pelo histórico

/**
 * Com histórico (usos, veículos), o servidor responde 422 e não apaga nada: o
 * cadastro fica como estava. Os outros erros seguem como erro comum.
 */
function recusadoPorHistorico(error: unknown) {
  return isAxiosError(error) && error.response?.status === 422;
}

/** A explicação do servidor, com o atalho para desativar (reversível) no lugar de apagar. */
function RemocaoRecusada({
  nome,
  ativo,
  mensagem,
  onDesativar,
}: {
  nome: string;
  ativo: boolean;
  mensagem: string;
  onDesativar: () => void;
}) {
  if (!ativo) {
    return (
      <Alert tone="warning">
        {nome} tem histórico e por isso não foi apagado. O cadastro já está desativado: não aparece nas novas
        escolhas, e o histórico continua guardado.
      </Alert>
    );
  }

  return (
    <Alert
      tone="warning"
      action={{
        label: (
          <>
            Desativar <span className="sr-only">{nome}</span>
          </>
        ),
        onClick: onDesativar,
      }}
    >
      {mensagem} Desativar não apaga nada e dá para reativar depois.
    </Alert>
  );
}

// ---------------------------------------------------------------- motoristas

function Motoristas() {
  const pedirConfirmacao = useConfirmar();
  const [lista, setLista] = useState<Motorista[] | null>(null);
  const [editando, setEditando] = useState<Motorista | "novo" | null>(null);
  // Erro de uma ação (desativar, remover) fica separado do erro da carga da lista.
  const [erroDeAcao, setErroDeAcao] = useState<string | null>(null);
  const [recusa, setRecusa] = useState<{ motorista: Motorista; mensagem: string } | null>(null);
  const [convidando, setConvidando] = useState<Motorista | null>(null);
  const [confirmacao, setConfirmacao] = useState<string | null>(null);
  const { carregando, erro: erroDeCarga, recarregar: carregar } = useCarregarLista(
    "motoristas",
    async (ativo) => {
      const dados = await motoristasService.listar(true);
      if (ativo()) setLista(dados);
    },
  );

  async function alternarAtivo(m: Motorista) {
    setErroDeAcao(null);
    setRecusa(null);
    try {
      await motoristasService.atualizar(m.id, { nome: m.nome, ativo: !m.ativo });
      carregar();
    } catch (error) {
      setErroDeAcao(mensagemErro(error));
    }
  }

  async function remover(m: Motorista) {
    const confirmou = await pedirConfirmacao({
      mensagem: `Remover o motorista ${m.nome}? Se ele já tiver usos de veículo no histórico, o sistema não apaga o cadastro e você poderá desativá-lo.`,
      confirmarTexto: "Remover",
      perigo: true,
    });
    if (!confirmou) return;

    setErroDeAcao(null);
    setRecusa(null);
    try {
      await motoristasService.remover(m.id);
      carregar();
    } catch (error) {
      if (recusadoPorHistorico(error)) {
        setRecusa({ motorista: m, mensagem: mensagemErro(error) });
      } else {
        setErroDeAcao(mensagemErro(error));
      }
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditando("novo")}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={15} /> Novo motorista
        </button>
      </div>

      {erroDeAcao && (
        <Alert tone="danger">
          {erroDeAcao}
        </Alert>
      )}

      {recusa && (
        <RemocaoRecusada
          nome={recusa.motorista.nome}
          ativo={recusa.motorista.ativo}
          mensagem={recusa.mensagem}
          onDesativar={() => void alternarAtivo(recusa.motorista)}
        />
      )}

      {confirmacao && (
        <Alert tone="success">
          {confirmacao}
        </Alert>
      )}

      {erroDeCarga && (
        <Alert tone="danger" action={{ label: "Tentar de novo", onClick: carregar }}>
          {erroDeCarga}
        </Alert>
      )}

      {carregando && !erroDeCarga && <p className="text-xs text-gray-500">Carregando...</p>}

      {lista && lista.length === 0 && (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
          Nenhum motorista cadastrado ainda.
        </p>
      )}

      {lista && lista.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {lista.map((m) => {
            const cnh = situacaoDaCnh(m.cnhValidade);

            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className={m.ativo ? "" : "opacity-50"}>
                  <p className="text-sm font-semibold text-gray-900">{m.nome}</p>
                  <p className="text-xs text-gray-500">
                    {[m.telefone, m.cnhNumero ? `CNH ${m.cnhNumero}` : null].filter(Boolean).join(" · ") || "Sem contato"}
                    {m.cnhValidade && ` · validade ${formatarData(m.cnhValidade)}`}
                  </p>
                  {cnh === "vencida" && (
                    <p className="mt-1">
                      <StatusChip tone="danger">CNH vencida</StatusChip>
                    </p>
                  )}
                  {cnh === "vence_em_breve" && (
                    <p className="mt-1">
                      <StatusChip tone="warning">CNH vence em breve</StatusChip>
                    </p>
                  )}
                  {m.acesso && (
                    <p className={`mt-1 text-xs font-medium ${ESTILO_ACESSO[m.acesso]}`}>
                      {ROTULO_ACESSO[m.acesso]}
                      {m.acesso !== "sem_acesso" && m.acessoEmail ? ` · ${m.acessoEmail}` : ""}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {/* Sem o estado de acesso (servidor antigo), não oferece o botão: não há como saber se já tem login. */}
                  {m.ativo && (m.acesso === "sem_acesso" || m.acesso === "convite_enviado") && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmacao(null);
                        setConvidando(m);
                      }}
                      aria-label={`${m.acesso === "convite_enviado" ? "Reenviar convite" : "Enviar acesso"} para ${m.nome}`}
                      className="flex h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 sm:h-8"
                    >
                      <Send size={14} /> {m.acesso === "convite_enviado" ? "Reenviar convite" : "Enviar acesso"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void alternarAtivo(m)}
                    className="h-8 rounded-lg px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    {m.ativo ? "Desativar" : "Reativar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditando(m)}
                    aria-label={`Editar ${m.nome}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remover(m)}
                    aria-label={`Remover ${m.nome}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editando && (
        <MotoristaModal
          motorista={editando === "novo" ? null : editando}
          onSalvo={() => {
            setEditando(null);
            carregar();
          }}
          onClose={() => setEditando(null)}
        />
      )}

      {convidando && (
        <AcessoMotoristaModal
          motorista={convidando}
          onEnviado={(mensagem) => {
            setConvidando(null);
            setConfirmacao(mensagem);
            carregar();
          }}
          onClose={() => setConvidando(null)}
        />
      )}
    </section>
  );
}

const ROTULO_ACESSO: Record<EstadoAcessoMotorista, string> = {
  sem_acesso: "Sem acesso ao sistema",
  convite_enviado: "Convite enviado, ainda não entrou",
  ativo: "Acesso ativo",
};

const ESTILO_ACESSO: Record<EstadoAcessoMotorista, string> = {
  sem_acesso: "text-gray-500",
  convite_enviado: "text-amber-700",
  ativo: "text-green-700",
};

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pede (ou confirma) o e-mail e manda o convite para o motorista criar a senha. */
function AcessoMotoristaModal({
  motorista,
  onEnviado,
  onClose,
}: {
  motorista: Motorista;
  onEnviado: (mensagem: string) => void;
  onClose: () => void;
}) {
  // Já tem login: o convite só pode ir para o mesmo e-mail (o servidor recusa outro).
  const emailFixo = motorista.acesso === "convite_enviado" && motorista.acessoEmail ? motorista.acessoEmail : null;
  const [email, setEmail] = useState(emailFixo ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const reenvio = motorista.acesso === "convite_enviado";

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const endereco = email.trim();

    if (!FORMATO_EMAIL.test(endereco)) {
      setErro("Informe um e-mail válido, como nome@empresa.com.br.");
      return;
    }

    try {
      setEnviando(true);
      await motoristasService.enviarAcesso(motorista.id, endereco);
      onEnviado(`Convite enviado para ${endereco}. ${motorista.nome} cria a senha pelo link recebido.`);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={reenvio ? "Reenviar convite" : "Enviar acesso"} icone={<Send size={16} />} onClose={onClose}>
      <form onSubmit={(e) => void enviar(e)} noValidate className="space-y-4 px-6 py-5">
        <p className="text-xs text-gray-600">
          {motorista.nome} recebe por e-mail um link para criar a senha. Com ela, reserva os veículos e registra saída e chegada.
        </p>
        <div>
          <label htmlFor="mot-acesso-email" className={classeDoRotulo}>E-mail do motorista</label>
          <input
            id="mot-acesso-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            maxLength={255}
            readOnly={emailFixo !== null}
            onChange={(e) => setEmail(e.target.value)}
            className={`${classeDoCampo} read-only:bg-gray-50`}
            autoFocus={emailFixo === null}
          />
          {emailFixo && <p className="mt-1 text-xs text-gray-500">O convite vai para o e-mail do login já criado.</p>}
        </div>

        {erro && (
          <Alert tone="danger">{erro}</Alert>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50 sm:h-10">
            Cancelar
          </button>
          <button type="submit" disabled={enviando} className="h-11 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:h-10">
            {enviando ? "Enviando..." : reenvio ? "Reenviar convite" : "Enviar convite"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function MotoristaModal({
  motorista,
  onSalvo,
  onClose,
}: {
  motorista: Motorista | null;
  onSalvo: () => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(motorista?.nome ?? "");
  const [telefone, setTelefone] = useState(motorista?.telefone ?? "");
  const [cnh, setCnh] = useState(motorista?.cnhNumero ?? "");
  const [validade, setValidade] = useState(motorista?.cnhValidade ?? "");
  // null enquanto carrega: só com a resposta dá para dizer que não há centro nenhum.
  const [centros, setCentros] = useState<CentroCusto[] | null>(null);
  const [centroId, setCentroId] = useState(motorista?.centroCustoId ? String(motorista.centroCustoId) : "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  // Na primeira configuração ainda não há centro: cria ali mesmo, sem fechar o motorista nem perder o que foi digitado.
  const [criandoCentro, setCriandoCentro] = useState(false);
  const podeCriarCentro = usePodeNaFrota()("centros_custo");

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

    return () => {
      ativo = false;
    };
  }, []);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Informe o nome do motorista.");
      return;
    }

    if (!centroId) {
      setErro("Escolha o centro de custo do motorista. As reservas dele saem nesse centro.");
      return;
    }

    const payload = {
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      cnh_numero: cnh.trim() || null,
      cnh_validade: validade || null,
      centro_custo_id: Number(centroId),
    };

    try {
      setSalvando(true);

      if (motorista) {
        await motoristasService.atualizar(motorista.id, payload);
      } else {
        await motoristasService.criar(payload);
      }

      onSalvo();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
    <Modal titulo={motorista ? "Editar motorista" : "Novo motorista"} icone={<UserRound size={16} />} onClose={onClose}>
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="mot-nome" className={classeDoRotulo}>Nome</label>
          <input id="mot-nome" type="text" value={nome} maxLength={120} onChange={(e) => setNome(e.target.value)} className={classeDoCampo} autoFocus />
        </div>
        <div>
          <label htmlFor="mot-tel" className={classeDoRotulo}>Telefone</label>
          <input id="mot-tel" type="text" value={telefone} maxLength={30} onChange={(e) => setTelefone(e.target.value)} className={classeDoCampo} />
        </div>
        <div>
          <label htmlFor="mot-centro" className={classeDoRotulo}>Centro de custo</label>
          <select id="mot-centro" value={centroId} onChange={(e) => setCentroId(e.target.value)} className={classeDoCampo}>
            <option value="">Escolha...</option>
            {(centros ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">As reservas do motorista saem nesse centro de custo.</p>
          {centros?.length === 0 && (
            <Alert
              tone="info"
              className="mt-2"
              action={podeCriarCentro ? { label: "Cadastrar centro de custo", onClick: () => setCriandoCentro(true) } : undefined}
            >
              {podeCriarCentro
                ? "Ainda não há centro de custo ativo para escolher. Cadastre um (por exemplo, Vendas ou Entregas) sem sair daqui: o que você já digitou continua no formulário."
                : "Ainda não há centro de custo ativo para escolher. Peça a quem gerencia os centros de custo da frota para cadastrar um."}
            </Alert>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mot-cnh" className={classeDoRotulo}>CNH (número)</label>
            <input id="mot-cnh" type="text" value={cnh} maxLength={20} onChange={(e) => setCnh(e.target.value)} className={classeDoCampo} />
          </div>
          <div>
            <label htmlFor="mot-validade" className={classeDoRotulo}>Validade da CNH</label>
            <input id="mot-validade" type="date" value={validade} onChange={(e) => setValidade(e.target.value)} className={classeDoCampo} />
          </div>
        </div>

        {erro && (
          <Alert tone="danger">{erro}</Alert>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>

    {/* Fora do <form> do motorista: o submit do centro não pode subir até ele pela árvore do React. */}
    {criandoCentro && (
      <CentroModal
        centro={null}
        onSalvo={(novo) => {
          setCriandoCentro(false);
          setCentros((atuais) => [...(atuais ?? []), novo]);
          setCentroId(String(novo.id));
        }}
        onClose={() => setCriandoCentro(false)}
      />
    )}
    </>
  );
}

// ----------------------------------------------------------- centros de custo

function Centros() {
  const pedirConfirmacao = useConfirmar();
  const [lista, setLista] = useState<CentroCusto[] | null>(null);
  const [editando, setEditando] = useState<CentroCusto | "novo" | null>(null);
  // Erro de uma ação (desativar, remover) fica separado do erro da carga da lista.
  const [erroDeAcao, setErroDeAcao] = useState<string | null>(null);
  const [recusa, setRecusa] = useState<{ centro: CentroCusto; mensagem: string } | null>(null);
  const { carregando, erro: erroDeCarga, recarregar: carregar } = useCarregarLista(
    "centros",
    async (ativo) => {
      const dados = await centrosCustoService.listar(true);
      if (ativo()) setLista(dados);
    },
  );

  async function alternarAtivo(c: CentroCusto) {
    setErroDeAcao(null);
    setRecusa(null);
    try {
      await centrosCustoService.atualizar(c.id, { nome: c.nome, codigo: c.codigo, ativo: !c.ativo });
      carregar();
    } catch (error) {
      setErroDeAcao(mensagemErro(error));
    }
  }

  async function remover(c: CentroCusto) {
    const confirmou = await pedirConfirmacao({
      mensagem: `Remover o centro de custo ${c.nome}? Se ele tiver veículos ou usos ligados, o sistema não apaga o cadastro e você poderá desativá-lo.`,
      confirmarTexto: "Remover",
      perigo: true,
    });
    if (!confirmou) return;

    setErroDeAcao(null);
    setRecusa(null);
    try {
      await centrosCustoService.remover(c.id);
      carregar();
    } catch (error) {
      // Com histórico, o servidor recusa (nada é apagado) e pede para desativar em vez de apagar.
      if (recusadoPorHistorico(error)) {
        setRecusa({ centro: c, mensagem: mensagemErro(error) });
      } else {
        setErroDeAcao(mensagemErro(error));
      }
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditando("novo")}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={15} /> Novo centro de custo
        </button>
      </div>

      {erroDeAcao && (
        <Alert tone="danger">
          {erroDeAcao}
        </Alert>
      )}

      {recusa && (
        <RemocaoRecusada
          nome={recusa.centro.nome}
          ativo={recusa.centro.ativo}
          mensagem={recusa.mensagem}
          onDesativar={() => void alternarAtivo(recusa.centro)}
        />
      )}

      {erroDeCarga && (
        <Alert tone="danger" action={{ label: "Tentar de novo", onClick: carregar }}>
          {erroDeCarga}
        </Alert>
      )}

      {carregando && !erroDeCarga && <p className="text-xs text-gray-500">Carregando...</p>}

      {lista && lista.length === 0 && (
        <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">
          Nenhum centro de custo cadastrado ainda. Exemplos: Vendas, Entregas, Diretoria.
        </p>
      )}

      {lista && lista.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {lista.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className={c.ativo ? "" : "opacity-50"}>
                <p className="text-sm font-semibold text-gray-900">{c.nome}</p>
                {c.codigo && <p className="text-xs text-gray-500">Código {c.codigo}</p>}
              </div>

              <div className="flex items-center gap-1">
                <button type="button" onClick={() => void alternarAtivo(c)} className="h-8 rounded-lg px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                  {c.ativo ? "Desativar" : "Reativar"}
                </button>
                <button type="button" onClick={() => setEditando(c)} aria-label={`Editar ${c.nome}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50">
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => void remover(c)} aria-label={`Remover ${c.nome}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <CentroModal
          centro={editando === "novo" ? null : editando}
          onSalvo={() => {
            setEditando(null);
            carregar();
          }}
          onClose={() => setEditando(null)}
        />
      )}
    </section>
  );
}

function CentroModal({
  centro,
  onSalvo,
  onClose,
}: {
  centro: CentroCusto | null;
  onSalvo: (salvo: CentroCusto) => void;
  onClose: () => void;
}) {
  const [nome, setNome] = useState(centro?.nome ?? "");
  const [codigo, setCodigo] = useState(centro?.codigo ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Informe o nome do centro de custo.");
      return;
    }

    const payload = { nome: nome.trim(), codigo: codigo.trim() || null };

    try {
      setSalvando(true);

      const salvo = centro
        ? await centrosCustoService.atualizar(centro.id, { ...payload, ativo: centro.ativo })
        : await centrosCustoService.criar(payload);

      onSalvo(salvo);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={centro ? "Editar centro de custo" : "Novo centro de custo"} icone={<Building2 size={16} />} onClose={onClose}>
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="cc-nome" className={classeDoRotulo}>Nome</label>
          <input id="cc-nome" type="text" value={nome} maxLength={80} onChange={(e) => setNome(e.target.value)} className={classeDoCampo} autoFocus />
        </div>
        <div>
          <label htmlFor="cc-codigo" className={classeDoRotulo}>Código (opcional)</label>
          <input id="cc-codigo" type="text" value={codigo} maxLength={30} onChange={(e) => setCodigo(e.target.value)} placeholder="Como está no sistema contábil" className={classeDoCampo} />
        </div>

        {erro && (
          <Alert tone="danger">{erro}</Alert>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
