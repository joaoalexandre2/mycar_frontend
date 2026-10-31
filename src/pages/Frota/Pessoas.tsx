import { useEffect, useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import { pessoasFrotaService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { useUsuarioDaFrota } from "../../hooks/usePodeNaFrota";
import type { PapelDaFrota, PessoaDaFrota } from "../../types/frota";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

const nomesDosPapeis: Record<PapelDaFrota, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  motorista: "Motorista",
};

/** Pessoas da frota e seus papéis. Só o administrador chega aqui. */
export function Pessoas() {
  const usuario = useUsuarioDaFrota();
  const [pessoas, setPessoas] = useState<PessoaDaFrota[] | null>(null);
  const [versao, setVersao] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papelNovo, setPapelNovo] = useState<"administrador" | "gestor">("gestor");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;

    pessoasFrotaService
      .listar()
      .then((resposta) => {
        if (!ativo) return;
        setPessoas(resposta);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [versao]);

  async function mudarPapel(pessoa: PessoaDaFrota, papel: PapelDaFrota) {
    setErro(null);
    setAviso(null);

    try {
      await pessoasFrotaService.mudarPapel(pessoa.id, papel);
      setAviso(`${pessoa.name} agora é ${nomesDosPapeis[papel].toLowerCase()}.`);
      setVersao((v) => v + 1);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  async function convidar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);
    setAviso(null);

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

      {erro && <p role="alert" className="text-xs text-red-600">{erro}</p>}
      {aviso && <p role="status" className="text-xs text-green-700">{aviso}</p>}

      {pessoas === null && !erro && <p className="text-xs text-gray-500">Carregando...</p>}

      {pessoas && pessoas.length > 0 && (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {pessoas.map((p) => {
            const euMesmo = p.id === usuario?.id;

            return (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {p.name} {euMesmo && <span className="text-xs font-normal text-gray-500">(você)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{p.email}</p>
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
    </div>
  );
}
