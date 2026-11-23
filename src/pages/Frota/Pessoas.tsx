import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { Link2, Send, UserPlus } from "lucide-react";
import { centrosCustoService, motoristasService, pessoasFrotaService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { useUsuarioDaFrota } from "../../hooks/usePodeNaFrota";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { Alert } from "../../components/ui/Alert";
import { Modal } from "../../components/ui/Modal";
import type { CentroCusto, LigacaoDeMotorista, Motorista, PapelDaFrota, PessoaDaFrota } from "../../types/frota";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
// No celular, alvo de toque de 44px; na tela grande, volta ao tamanho de sempre.
const classeCampoDoModal =
  "h-11 md:h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500 aria-[invalid=true]:border-red-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

const nomesDosPapeis: Record<PapelDaFrota, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  motorista: "Motorista",
};

/** O servidor diz a que cadastro de motorista o login está ligado (servidor antigo não manda o campo). */
const informaLigacao = (pessoa: PessoaDaFrota) => pessoa.motorista !== undefined;

/**
 * Só oferece o reenvio quando o servidor diz que a pessoa ainda não entrou. Servidor antigo
 * (sem o campo) ou valor desconhecido: a tela não afirma nada nem oferece a ação.
 */
const aguardaPrimeiroAcesso = (pessoa: PessoaDaFrota) => pessoa.acesso === "convite_enviado";

/** Pessoas da frota e seus papéis. Só o administrador chega aqui. */
export function Pessoas() {
  const usuario = useUsuarioDaFrota();
  const pedirConfirmacao = useConfirmar();
  const [pessoas, setPessoas] = useState<PessoaDaFrota[] | null>(null);
  // Cadastros de motorista da conta. null = não deu para ler (a tela não afirma nada com base neles).
  const [motoristas, setMotoristas] = useState<Motorista[] | null>(null);
  const [versao, setVersao] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  // Mudança feita, mas que ainda não deixa a pessoa trabalhar (ex.: motorista sem cadastro ligado).
  const [pendencia, setPendencia] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papelNovo, setPapelNovo] = useState<"administrador" | "gestor">("gestor");
  const [enviando, setEnviando] = useState(false);
  // Pessoa cujo login está sendo ligado a um cadastro de motorista (modal aberto).
  const [ligando, setLigando] = useState<PessoaDaFrota | null>(null);
  // Pessoa cujo convite está sendo reenviado agora (o botão dela fica ocupado).
  const [reenviandoId, setReenviandoId] = useState<number | null>(null);
  // Textos do que cada permissão e menu quer dizer (vêm junto da lista).
  const [rotulos, setRotulos] = useState<{ permissoes: Record<string, string>; menus: Record<string, string> }>({ permissoes: {}, menus: {} });

  useEffect(() => {
    let ativo = true;

    pessoasFrotaService
      .listar()
      .then((resposta) => {
        if (!ativo) return;
        setPessoas(resposta.pessoas);
        setRotulos({ permissoes: resposta.catalogo, menus: resposta.menus });
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    // Servem para o servidor antigo (quem tem cadastro ligado) e para escolher um cadastro sem login.
    motoristasService
      .listar(true)
      .then((lista) => {
        if (ativo) setMotoristas(lista);
      })
      .catch(() => {
        if (ativo) setMotoristas(null);
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  // Logins ligados a um cadastro de motorista, pela lista de motoristas (usado só quando o servidor não informa).
  const comCadastroDeMotorista = useMemo(
    () =>
      motoristas === null
        ? null
        : new Set(motoristas.map((m) => m.userId).filter((id): id is number => typeof id === "number")),
    [motoristas],
  );

  // Cadastros ativos que ainda não têm login: os que podem ser ligados a uma pessoa.
  const motoristasSemLogin = useMemo(
    () => (motoristas ?? []).filter((m) => m.ativo && (m.userId === null || m.userId === undefined)),
    [motoristas],
  );

  const semCadastroDeMotorista = (pessoa: PessoaDaFrota) =>
    informaLigacao(pessoa)
      ? pessoa.motorista === null
      : comCadastroDeMotorista !== null && !comCadastroDeMotorista.has(pessoa.id);

  async function mudarPapel(pessoa: PessoaDaFrota, papel: PapelDaFrota) {
    setErro(null);
    setAviso(null);
    setPendencia(null);

    const faltaCadastro = papel === "motorista" && semCadastroDeMotorista(pessoa);
    const daParaLigarAqui = informaLigacao(pessoa);

    if (papel === "administrador") {
      const confirmado = await pedirConfirmacao({
        titulo: `Tornar ${pessoa.name} administrador?`,
        mensagem:
          "Administradores veem e alteram tudo na frota: veículos, motoristas, custos, pessoas e papéis, inclusive o de outros administradores.",
        confirmarTexto: "Tornar administrador",
      });
      if (!confirmado) return;
    }

    if (faltaCadastro) {
      const confirmado = await pedirConfirmacao({
        titulo: "Falta o cadastro de motorista",
        mensagem:
          `${pessoa.name} não está ligado a nenhum cadastro de motorista. Só com o papel, não consegue reservar veículos.\n\n` +
          (daParaLigarAqui
            ? 'Depois de mudar o papel, use "Ligar a um motorista" nesta tela para escolher um cadastro ou criar um.'
            : 'Para dar acesso a um motorista, cadastre-o em Cadastros > Motoristas e use "Enviar acesso".'),
        confirmarTexto: "Mudar o papel mesmo assim",
      });
      if (!confirmado) return;
    }

    try {
      await pessoasFrotaService.mudarPapel(pessoa.id, papel);
      if (faltaCadastro) {
        setPendencia(
          `${pessoa.name} agora tem o papel de motorista, mas ainda não consegue reservar: falta um cadastro de motorista ligado a este login.` +
            (daParaLigarAqui ? ' Use "Ligar a um motorista" na linha da pessoa.' : ""),
        );
      } else {
        setAviso(`${pessoa.name} agora é ${nomesDosPapeis[papel].toLowerCase()}.`);
      }
      setVersao((v) => v + 1);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function convidar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setAviso(null);
    setPendencia(null);

    if (!nome.trim() || !email.trim()) {
      setErro("Informe o nome e o e-mail da pessoa.");
      return;
    }

    try {
      setEnviando(true);
      const nova = await pessoasFrotaService.convidar({ nome: nome.trim(), email: email.trim(), papel: papelNovo });
      setAviso(`Convite enviado para ${nova.email}. A pessoa define a senha pelo link recebido.`);
      setNome("");
      setEmail("");
      setVersao((v) => v + 1);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  async function reenviarConvite(pessoa: PessoaDaFrota) {
    setErro(null);
    setAviso(null);
    setPendencia(null);

    try {
      setReenviandoId(pessoa.id);
      const { mensagem } = await pessoasFrotaService.reenviarConvite(pessoa.id);
      setAviso(mensagem ?? `Convite reenviado para ${pessoa.email}.`);
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;

      if (status === 429) {
        // Vale tanto para o intervalo do convite quanto para o limite de pedidos da rota.
        setErro(`Acabamos de enviar um convite para ${pessoa.name}. Aguarde um minuto e tente reenviar de novo.`);
      } else {
        setErro(mensagemErro(error));
        // 422: a pessoa já entrou; 404: saiu da frota. Atualiza só a lista, sem apagar a mensagem.
        if (status === 422 || status === 404) {
          pessoasFrotaService
            .listar()
            .then((resposta) => setPessoas(resposta.pessoas))
            .catch(() => undefined);
        }
      }
    } finally {
      setReenviandoId(null);
    }
  }

  function abrirLigacao(pessoa: PessoaDaFrota) {
    setErro(null);
    setAviso(null);
    setPendencia(null);
    setLigando(pessoa);
  }

  function aoLigar(pessoa: PessoaDaFrota, atualizada: PessoaDaFrota) {
    setLigando(null);
    const cadastro = atualizada.motorista?.nome;
    setAviso(
      cadastro
        ? `${pessoa.name} agora está ligado ao cadastro de motorista ${cadastro} e já pode reservar.`
        : `${pessoa.name} agora está ligado a um cadastro de motorista.`,
    );
    setVersao((v) => v + 1);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={(e) => void convidar(e)} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
        <p className="text-sm font-semibold text-gray-900">Convidar pessoa</p>
        <div>
          <label htmlFor="pes-nome" className={rotulo}>Nome</label>
          <input id="pes-nome" type="text" value={nome} maxLength={255} onChange={(e) => setNome(e.target.value)} className={classeCampo} />
        </div>
        <div>
          <label htmlFor="pes-email" className={rotulo}>E-mail</label>
          <input id="pes-email" type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} className={classeCampo} />
        </div>
        <div>
          <label htmlFor="pes-papel" className={rotulo}>Papel</label>
          <select id="pes-papel" value={papelNovo} onChange={(e) => setPapelNovo(e.target.value as "administrador" | "gestor")} className={classeCampo}>
            <option value="gestor">Gestor</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={enviando}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white disabled:opacity-60"
        >
          <UserPlus size={14} /> Enviar convite
        </button>
        <p className="text-xs text-gray-500">Motoristas são cadastrados na aba Motoristas.</p>
      </form>

      {erro && <Alert tone="danger">{erro}</Alert>}
      {aviso && <Alert tone="success">{aviso}</Alert>}
      {pendencia && (
        <Alert tone="warning">{pendencia}</Alert>
      )}

      {pessoas === null && !erro && <p className="text-xs text-gray-500">Carregando...</p>}

      {pessoas && pessoas.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {pessoas.map((p) => {
            const euMesmo = p.id === usuario?.id;
            const faltaCadastro = p.papel === "motorista" && semCadastroDeMotorista(p);
            const podeReenviar = !euMesmo && aguardaPrimeiroAcesso(p);
            const reenviando = reenviandoId === p.id;

            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {p.name} {euMesmo && <span className="text-xs font-normal text-gray-500">(você)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{p.email}</p>
                  {p.acesso === "convite_enviado" && (
                    <p className="mt-1 text-xs font-semibold text-(--tom-warning-texto)">
                      Convite enviado: ainda não entrou no sistema.
                    </p>
                  )}
                  {p.acesso === "ativo" && <p className="mt-1 text-xs text-gray-500">Já entrou no sistema.</p>}
                  <p className="mt-1 text-xs text-gray-600">
                    {p.papel === "administrador"
                      ? "Pode tudo, como administrador."
                      : [
                          ...(p.permissoes ?? []).map((chave) => rotulos.permissoes[chave] ?? chave),
                          ...(p.menus ?? []).map((chave) => `vê o menu ${rotulos.menus[chave] ?? chave}`),
                        ].join(" · ") || "Sem permissões extras."}
                  </p>
                  {p.papel === "motorista" && p.motorista && (
                    <p className="mt-1 text-xs text-gray-600">Cadastro de motorista: {p.motorista.nome}</p>
                  )}
                  {faltaCadastro && (
                    <p className="mt-1 text-xs font-semibold text-(--tom-warning-texto)">
                      Ainda não consegue reservar: falta um cadastro de motorista ligado a este login.
                    </p>
                  )}
                  {faltaCadastro && informaLigacao(p) && (
                    <button
                      type="button"
                      onClick={() => abrirLigacao(p)}
                      className="mt-2 inline-flex h-11 items-center gap-2 rounded-lg border border-(--tom-warning-borda) bg-(--tom-warning-fundo) px-3 text-xs font-semibold text-(--tom-warning-texto) hover:border-(--tom-warning-texto) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 md:h-9"
                    >
                      <Link2 size={14} aria-hidden="true" /> Ligar a um motorista
                      <span className="sr-only">: {p.name}</span>
                    </button>
                  )}
                  {podeReenviar && (
                    <button
                      type="button"
                      onClick={() => void reenviarConvite(p)}
                      disabled={reenviando}
                      aria-busy={reenviando}
                      // O nome acessível começa pelo texto visível e diz de quem é o convite.
                      aria-label={`${reenviando ? "Reenviando convite" : "Reenviar convite"} para ${p.name}`}
                      className="mt-2 flex h-11 w-fit items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 md:h-9"
                    >
                      <Send size={14} aria-hidden="true" /> {reenviando ? "Reenviando convite" : "Reenviar convite"}
                    </button>
                  )}
                </div>
                <label className="text-xs text-gray-700">
                  <span className="sr-only">Papel de {p.name}</span>
                  <select
                    aria-label={`Papel de ${p.name}`}
                    value={p.papel}
                    disabled={euMesmo}
                    onChange={(e) => void mudarPapel(p, e.target.value as PapelDaFrota)}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 disabled:opacity-60"
                  >
                    {(Object.keys(nomesDosPapeis) as PapelDaFrota[]).map((papel) => (
                      <option key={papel} value={papel}>
                        {nomesDosPapeis[papel]}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {ligando && (
        <LigarMotoristaModal
          pessoa={ligando}
          // Lista de motoristas indisponível: só dá para criar o cadastro.
          candidatos={motoristas === null ? null : motoristasSemLogin}
          onClose={() => setLigando(null)}
          onLigado={(atualizada) => aoLigar(ligando, atualizada)}
        />
      )}
    </div>
  );
}

type Modo = "existente" | "criar";

/**
 * Liga o login de uma pessoa (papel motorista) a um cadastro de motorista: escolhendo
 * um cadastro ativo que ainda não tem login, ou criando o cadastro com o nome dela.
 */
function LigarMotoristaModal({
  pessoa,
  candidatos,
  onClose,
  onLigado,
}: {
  pessoa: PessoaDaFrota;
  candidatos: Motorista[] | null;
  onClose: () => void;
  onLigado: (atualizada: PessoaDaFrota) => void;
}) {
  const id = useId();
  const temCandidatos = (candidatos?.length ?? 0) > 0;
  const [modo, setModo] = useState<Modo>(temCandidatos ? "existente" : "criar");
  const [motoristaId, setMotoristaId] = useState("");
  const [centroId, setCentroId] = useState("");
  const [cnhNumero, setCnhNumero] = useState("");
  const [cnhValidade, setCnhValidade] = useState("");
  const [centros, setCentros] = useState<CentroCusto[] | null>(null);
  const [erroCentros, setErroCentros] = useState<string | null>(null);
  const [erroCampo, setErroCampo] = useState<"motorista" | "centro" | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campoMotorista = useRef<HTMLSelectElement>(null);
  const campoCentro = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    let ativo = true;

    centrosCustoService
      .listar()
      .then((lista) => {
        if (ativo) setCentros(lista.filter((c) => c.ativo));
      })
      .catch((error) => {
        if (ativo) setErroCentros(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, []);

  function escolherModo(novo: Modo) {
    setModo(novo);
    setErroCampo(null);
    setErro(null);
  }

  async function ligar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setErroCampo(null);

    let ligacao: LigacaoDeMotorista;

    if (modo === "existente") {
      if (!motoristaId) {
        setErroCampo("motorista");
        campoMotorista.current?.focus();
        return;
      }
      ligacao = { motorista_id: Number(motoristaId) };
    } else {
      if (!centroId) {
        setErroCampo("centro");
        campoCentro.current?.focus();
        return;
      }
      ligacao = {
        centro_custo_id: Number(centroId),
        cnh_numero: cnhNumero.trim() || null,
        cnh_validade: cnhValidade || null,
      };
    }

    try {
      setEnviando(true);
      onLigado(await pessoasFrotaService.ligarMotorista(pessoa.id, ligacao));
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  const idForm = `${id}-form`;
  const idErro = `${id}-erro`;
  const idErroMotorista = `${id}-erro-motorista`;
  const idErroCentro = `${id}-erro-centro`;
  const classeOpcao =
    "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs text-gray-700 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60";

  return (
    <Modal
      titulo="Ligar a um motorista"
      subtitulo={`${pessoa.name} só reserva veículos com o login ligado a um cadastro de motorista.`}
      icone={<Link2 size={16} aria-hidden="true" />}
      onClose={onClose}
      rodape={
        <div className="space-y-2">
          {erro && (
            <Alert tone="danger" id={idErro} className="whitespace-pre-line">
              {erro}
            </Alert>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-700 md:h-10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form={idForm}
              disabled={enviando}
              aria-describedby={erro ? idErro : undefined}
              className="h-11 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white disabled:opacity-60 md:h-10"
            >
              {enviando ? "Ligando..." : "Ligar"}
            </button>
          </div>
        </div>
      }
    >
      <form id={idForm} noValidate onSubmit={(e) => void ligar(e)} className="space-y-4 px-6 py-4">
        <fieldset className="space-y-2">
          <legend className={rotulo}>Como ligar</legend>
          <label className={classeOpcao}>
            <input
              type="radio"
              name={`${id}-modo`}
              value="existente"
              checked={modo === "existente"}
              disabled={!temCandidatos}
              onChange={() => escolherModo("existente")}
            />
            Escolher um motorista já cadastrado
          </label>
          {!temCandidatos && (
            <p className="text-xs text-gray-500">
              {candidatos === null
                ? "Não deu para carregar os motoristas cadastrados. Ainda dá para criar o cadastro."
                : "Nenhum motorista ativo sem acesso cadastrado. Crie o cadastro a partir da pessoa."}
            </p>
          )}
          <label className={classeOpcao}>
            <input type="radio" name={`${id}-modo`} value="criar" checked={modo === "criar"} onChange={() => escolherModo("criar")} />
            Criar o cadastro com o nome {pessoa.name}
          </label>
        </fieldset>

        {modo === "existente" && (
          <div>
            <label htmlFor={`${id}-motorista`} className={rotulo}>
              Motorista sem acesso
            </label>
            <select
              id={`${id}-motorista`}
              ref={campoMotorista}
              value={motoristaId}
              required
              aria-invalid={erroCampo === "motorista"}
              aria-describedby={erroCampo === "motorista" ? idErroMotorista : undefined}
              onChange={(e) => {
                setMotoristaId(e.target.value);
                setErroCampo(null);
              }}
              className={classeCampoDoModal}
            >
              <option value="">Escolha o motorista</option>
              {(candidatos ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
            {erroCampo === "motorista" && (
              <p id={idErroMotorista} className="mt-1 text-xs text-(--tom-danger-texto)">
                Escolha o motorista que será ligado a {pessoa.name}.
              </p>
            )}
          </div>
        )}

        {modo === "criar" && (
          <>
            <div>
              <label htmlFor={`${id}-centro`} className={rotulo}>
                Centro de custo (obrigatório)
              </label>
              <select
                id={`${id}-centro`}
                ref={campoCentro}
                value={centroId}
                required
                aria-invalid={erroCampo === "centro"}
                aria-describedby={erroCampo === "centro" ? idErroCentro : erroCentros ? `${id}-erro-centros` : undefined}
                onChange={(e) => {
                  setCentroId(e.target.value);
                  setErroCampo(null);
                }}
                className={classeCampoDoModal}
              >
                <option value="">{centros === null && !erroCentros ? "Carregando..." : "Escolha o centro de custo"}</option>
                {(centros ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              {erroCampo === "centro" && (
                <p id={idErroCentro} className="mt-1 text-xs text-(--tom-danger-texto)">
                  Escolha o centro de custo: as reservas de {pessoa.name} saem nele.
                </p>
              )}
              {erroCentros && (
                <p id={`${id}-erro-centros`} className="mt-1 text-xs text-(--tom-danger-texto)">
                  Não deu para carregar os centros de custo: {erroCentros}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={`${id}-cnh`} className={rotulo}>
                  Número da CNH
                </label>
                <input
                  id={`${id}-cnh`}
                  type="text"
                  value={cnhNumero}
                  maxLength={20}
                  onChange={(e) => setCnhNumero(e.target.value)}
                  className={classeCampoDoModal}
                />
              </div>
              <div>
                <label htmlFor={`${id}-validade`} className={rotulo}>
                  Validade da CNH
                </label>
                <input
                  id={`${id}-validade`}
                  type="date"
                  value={cnhValidade}
                  onChange={(e) => setCnhValidade(e.target.value)}
                  className={classeCampoDoModal}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Sem a validade da CNH, o motorista não consegue reservar. Dá para completar depois em Cadastros &gt; Motoristas.
            </p>
          </>
        )}
      </form>
    </Modal>
  );
}
