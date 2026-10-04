import { useEffect, useState, type FormEvent } from "react";
import { Building2, Check, Palette, Settings, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { mensagemErro } from "../../services/api";
import { configuracaoService } from "../../services/configuracao";
import {
  OPCOES_ITENS_POR_PAGINA,
  obterCor,
  obterItensPorPagina,
  obterTema,
  salvarAparencia,
  salvarItensPorPagina,
  type Cor,
  type Tema,
} from "../../utils/preferencias";

type Aba = "perfil" | "oficina" | "sistema" | "aparencia";

const ABAS: { chave: Aba; rotulo: string; icone: React.ReactNode }[] = [
  { chave: "perfil", rotulo: "Perfil", icone: <User size={17} /> },
  { chave: "oficina", rotulo: "Oficina", icone: <Building2 size={17} /> },
  { chave: "sistema", rotulo: "Sistema", icone: <Settings size={17} /> },
  { chave: "aparencia", rotulo: "Aparência", icone: <Palette size={17} /> },
];

export function Configuracoes() {
  const [aba, setAba] = useState<Aba>("perfil");

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h2 className="text-[21px] font-bold text-gray-900">Configurações</h2>
        <p className="mt-1 text-xs text-gray-500">
          Gerencie seu perfil, os dados da oficina e as preferências do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr] lg:gap-6">
        <nav className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2 lg:h-fit lg:flex-col lg:overflow-visible">
          {ABAS.map((item) => (
            <button
              key={item.chave}
              onClick={() => setAba(item.chave)}
              className={`flex h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-sm transition lg:w-full ${
                aba === item.chave
                  ? "bg-blue-50 font-semibold text-blue-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icone}
              {item.rotulo}
            </button>
          ))}
        </nav>

        <div className="min-w-0 rounded-xl border border-gray-200 bg-white">
          {aba === "perfil" && <Perfil />}
          {aba === "oficina" && <Oficina />}
          {aba === "sistema" && <Sistema />}
          {aba === "aparencia" && <Aparencia />}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Perfil ---------------------------- */

function Perfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const [nome, setNome] = useState(usuario?.name ?? "");
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [avisoSenha, setAvisoSenha] = useState<Aviso | null>(null);

  async function salvarPerfil(event: FormEvent) {
    event.preventDefault();
    setAviso(null);

    try {
      setSalvando(true);
      atualizarUsuario(await configuracaoService.atualizarPerfil(nome.trim()));
      setAviso({ tipo: "ok", texto: "Perfil atualizado." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemErro(error) });
    } finally {
      setSalvando(false);
    }
  }

  async function alterarSenha(event: FormEvent) {
    event.preventDefault();
    setAvisoSenha(null);

    if (novaSenha !== confirmacao) {
      setAvisoSenha({ tipo: "erro", texto: "A confirmação não é igual à nova senha." });
      return;
    }

    try {
      setSalvandoSenha(true);
      await configuracaoService.alterarSenha({
        senha_atual: senhaAtual,
        password: novaSenha,
        password_confirmation: confirmacao,
      });
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      setAvisoSenha({ tipo: "ok", texto: "Senha alterada." });
    } catch (error) {
      setAvisoSenha({ tipo: "erro", texto: mensagemErro(error) });
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <>
      <Secao titulo="Perfil" descricao="Seus dados de acesso.">
        <form onSubmit={(e) => void salvarPerfil(e)} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Campo label="Nome">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className={ESTILO_CAMPO}
              />
            </Campo>
            <Campo label="E-mail">
              <input
                value={usuario?.email ?? ""}
                disabled
                className={`${ESTILO_CAMPO} cursor-not-allowed opacity-60`}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                O e-mail é o seu login e não pode ser alterado aqui.
              </p>
            </Campo>
          </div>
          <Rodape aviso={aviso} salvando={salvando} rotulo="Salvar perfil" />
        </form>
      </Secao>

      <Secao titulo="Alterar senha" descricao="Use pelo menos 8 caracteres." separada>
        <form onSubmit={(e) => void alterarSenha(e)} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Campo label="Senha atual">
              <input
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                required
                autoComplete="current-password"
                className={ESTILO_CAMPO}
              />
            </Campo>
            <Campo label="Nova senha">
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={ESTILO_CAMPO}
              />
            </Campo>
            <Campo label="Confirmar nova senha">
              <input
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={ESTILO_CAMPO}
              />
            </Campo>
          </div>
          <Rodape aviso={avisoSenha} salvando={salvandoSenha} rotulo="Alterar senha" />
        </form>
      </Secao>
    </>
  );
}

/* ---------------------------- Oficina ---------------------------- */

function Oficina() {
  const [dados, setDados] = useState({ nome: "", cnpj: "", telefone: "", endereco: "" });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  useEffect(() => {
    let ativo = true;

    configuracaoService
      .buscarOficina()
      .then((oficina) => {
        if (!ativo) return;
        setDados({
          nome: oficina.nome,
          cnpj: oficina.cnpj ?? "",
          telefone: oficina.telefone ?? "",
          endereco: oficina.endereco ?? "",
        });
      })
      .catch((error) => {
        if (ativo) setAviso({ tipo: "erro", texto: mensagemErro(error) });
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function salvar(event: FormEvent) {
    event.preventDefault();
    setAviso(null);

    try {
      setSalvando(true);
      await configuracaoService.atualizarOficina({
        nome: dados.nome.trim(),
        cnpj: dados.cnpj.trim() || null,
        telefone: dados.telefone.trim() || null,
        endereco: dados.endereco.trim() || null,
      });
      setAviso({ tipo: "ok", texto: "Dados da oficina atualizados." });
    } catch (error) {
      setAviso({ tipo: "erro", texto: mensagemErro(error) });
    } finally {
      setSalvando(false);
    }
  }

  const campo = (chave: keyof typeof dados, label: string, obrigatorio = false) => (
    <Campo label={label}>
      <input
        value={dados[chave]}
        onChange={(e) => setDados({ ...dados, [chave]: e.target.value })}
        required={obrigatorio}
        disabled={carregando}
        className={ESTILO_CAMPO}
      />
    </Campo>
  );

  return (
    <Secao titulo="Oficina" descricao="Informações da sua oficina.">
      <form onSubmit={(e) => void salvar(e)} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {campo("nome", "Nome da oficina", true)}
          {campo("cnpj", "CNPJ")}
          {campo("telefone", "Telefone")}
          {campo("endereco", "Endereço")}
        </div>
        <Rodape aviso={aviso} salvando={salvando} rotulo="Salvar oficina" />
      </form>
    </Secao>
  );
}

/* ---------------------------- Sistema ---------------------------- */

function Sistema() {
  const [itens, setItens] = useState(obterItensPorPagina());

  return (
    <Secao
      titulo="Sistema"
      descricao="Preferências deste navegador. Valem a partir da próxima vez que abrir uma lista."
    >
      <div className="max-w-xs">
        <Campo label="Itens por página nas listas">
          <select
            value={itens}
            onChange={(e) => {
              const valor = Number(e.target.value);
              setItens(valor);
              salvarItensPorPagina(valor);
            }}
            className={ESTILO_CAMPO}
          >
            {OPCOES_ITENS_POR_PAGINA.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        </Campo>
        <p className="mt-2 text-[11px] text-gray-400">
          Salvo automaticamente neste navegador.
        </p>
      </div>
    </Secao>
  );
}

/* ---------------------------- Aparência ---------------------------- */

const CORES: { chave: Cor; classe: string; nome: string }[] = [
  { chave: "blue", classe: "bg-blue-600", nome: "Azul" },
  { chave: "green", classe: "bg-green-600", nome: "Verde" },
  { chave: "purple", classe: "bg-purple-600", nome: "Roxo" },
  { chave: "orange", classe: "bg-orange-500", nome: "Laranja" },
];

function Aparencia() {
  const [tema, setTema] = useState<Tema>(obterTema());
  const [cor, setCor] = useState<Cor>(obterCor());

  function escolher(novoTema: Tema, novaCor: Cor) {
    setTema(novoTema);
    setCor(novaCor);
    salvarAparencia(novoTema, novaCor);
  }

  return (
    <Secao
      titulo="Aparência"
      descricao="Muda na hora e fica salvo neste navegador."
    >
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-medium text-gray-700">Tema</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                ["claro", "Claro", "Interface clara"],
                ["escuro", "Escuro", "Interface escura"],
              ] as const
            ).map(([chave, titulo, descricao]) => (
              <button
                key={chave}
                onClick={() => escolher(chave, cor)}
                className={`rounded-lg border p-4 text-left transition ${
                  tema === chave
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      tema === chave ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {titulo}
                  </span>
                  {tema === chave && <Check size={16} className="text-blue-600" />}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">{descricao}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-700">Cor principal</p>
          <div className="flex gap-3">
            {CORES.map((item) => (
              <button
                key={item.chave}
                onClick={() => escolher(tema, item.chave)}
                title={item.nome}
                aria-label={item.nome}
                className={`flex h-10 w-10 items-center justify-center rounded-full ${item.classe} ${
                  cor === item.chave ? "ring-2 ring-gray-900 ring-offset-2" : ""
                }`}
              >
                {cor === item.chave && <Check size={16} className="text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Secao>
  );
}

/* ---------------------------- Peças de UI ---------------------------- */

type Aviso = { tipo: "ok" | "erro"; texto: string };

const ESTILO_CAMPO =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50";

function Secao({
  titulo,
  descricao,
  children,
  separada = false,
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
  separada?: boolean;
}) {
  return (
    <div className={separada ? "border-t border-gray-200" : ""}>
      <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
        <h3 className="text-sm font-semibold text-gray-900">{titulo}</h3>
        <p className="mt-1 text-[11px] text-gray-400">{descricao}</p>
      </div>
      <div className="px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Rodape({
  aviso,
  salvando,
  rotulo,
}: {
  aviso: Aviso | null;
  salvando: boolean;
  rotulo: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={salvando}
        className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {salvando ? "Salvando..." : rotulo}
      </button>
      {aviso && (
        <span
          role="status"
          className={`text-xs ${aviso.tipo === "ok" ? "text-green-600" : "text-red-600"}`}
        >
          {aviso.texto}
        </span>
      )}
    </div>
  );
}
