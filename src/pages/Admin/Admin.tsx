import { useEffect, useState } from "react";
import {
  Building2,
  Car,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  History,
  Search,
  Send,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { StatCard } from "../../components/dashboard/StatCard";
import {
  adminConteudoService,
  adminService,
  type AcessoAdmin,
  type ContaAdmin,
  type ResumoPlataforma,
} from "../../services/admin";
import { ConteudoUsuario } from "./ConteudoUsuario";
import { mensagemErro } from "../../services/api";
import type { Perfil } from "../../types/auth";

type Aviso = { tipo: "ok" | "erro"; texto: string };

const ROTULO_PERFIL: Record<Perfil, string> = {
  oficina: "Oficina",
  pessoa: "Cuidados com seu carro",
  frota: "Frota",
};

function formatarDataHora(iso: string | null) {
  if (!iso) {
    return "—";
  }

  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) {
    return "—";
  }

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Admin() {
  const [resumo, setResumo] = useState<ResumoPlataforma | null>(null);
  const [contas, setContas] = useState<ContaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [reenviandoId, setReenviandoId] = useState<number | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [verConteudoDe, setVerConteudoDe] = useState<number | null>(null);
  const [acessos, setAcessos] = useState<AcessoAdmin[] | null>(null);

  function fecharConteudo() {
    setVerConteudoDe(null);
    // O registro de acessos inclui a consulta que acabou de ser feita.
    if (acessos !== null) {
      adminConteudoService.acessos().then(setAcessos).catch(() => undefined);
    }
  }

  function alternarAcessos() {
    if (acessos !== null) {
      setAcessos(null);
      return;
    }

    adminConteudoService
      .acessos()
      .then(setAcessos)
      .catch((erro) => setAviso({ tipo: "erro", texto: mensagemErro(erro) }));
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
      setPagina(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    let cancelado = false;

    adminService
      .resumo()
      .then((dados) => {
        if (!cancelado) {
          setResumo(dados);
        }
      })
      .catch((erro) => {
        if (!cancelado) {
          setAviso({ tipo: "erro", texto: mensagemErro(erro) });
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    let cancelado = false;

    adminService
      .contas({ pagina, busca: buscaDebounced })
      .then((resultado) => {
        if (cancelado) {
          return;
        }

        setContas(resultado.dados);
        setTotalPaginas(resultado.totalPaginas);
        setTotalRegistros(resultado.totalRegistros);
      })
      .catch((erro) => {
        if (!cancelado) {
          setAviso({ tipo: "erro", texto: mensagemErro(erro) });
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCarregando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [pagina, buscaDebounced]);

  function irParaPagina(proxima: number) {
    setCarregando(true);
    setPagina(proxima);
  }

  async function reenviarConfirmacao(conta: ContaAdmin) {
    setReenviandoId(conta.id);
    setAviso(null);

    try {
      const mensagem = await adminService.reenviarConfirmacao(conta.id);
      setAviso({ tipo: "ok", texto: mensagem });
    } catch (erro) {
      setAviso({ tipo: "erro", texto: mensagemErro(erro) });
    } finally {
      setReenviandoId(null);
    }
  }

  const numero = (valor: number | undefined) =>
    valor === undefined ? "—" : valor.toLocaleString("pt-BR");

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7">
        <h2 className="text-[21px] font-bold text-gray-900">
          Administração
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Visão geral da plataforma. A lista mostra números e dados de conta;
          em "Ver conteúdo" você lê, só para leitura, o que o usuário cadastrou.
          Cada consulta fica registrada.
        </p>
      </div>

      {aviso && (
        <p
          role="status"
          className={`mb-5 rounded-lg border px-4 py-3 text-xs ${
            aviso.tipo === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {aviso.texto}
        </p>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Oficinas cadastradas"
          value={numero(resumo?.oficinas)}
          description={
            resumo
              ? `Fora elas: ${resumo.contasPessoa} de pessoa e ${resumo.contasFrota} de frota`
              : "Contas criadas na plataforma"
          }
          icon={<Building2 size={19} />}
        />
        <StatCard
          title="Usuários"
          value={numero(resumo?.usuarios)}
          description={
            resumo
              ? `${resumo.emailPendente} com e-mail por confirmar`
              : "Carregando..."
          }
          icon={<Users size={19} />}
        />
        <StatCard
          title="Novos cadastros (7 dias)"
          value={numero(resumo?.cadastros7Dias)}
          description={
            resumo ? `${resumo.cadastros30Dias} nos últimos 30 dias` : "Carregando..."
          }
          icon={<UserPlus size={19} />}
        />
        <StatCard
          title="Acessaram em 7 dias"
          value={numero(resumo?.ativos7Dias)}
          description="Contas que entraram no sistema"
          icon={<UserCheck size={19} />}
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Clientes cadastrados"
          value={numero(resumo?.totais.clientes)}
          description="Somando todas as oficinas"
          icon={<Users size={19} />}
        />
        <StatCard
          title="Veículos"
          value={numero(resumo?.totais.veiculos)}
          description="Somando todas as oficinas"
          icon={<Car size={19} />}
        />
        <StatCard
          title="Ordens de serviço"
          value={numero(resumo?.totais.ordensServico)}
          description="Somando todas as oficinas"
          icon={<ClipboardList size={19} />}
        />
        <StatCard
          title="Manutenções"
          value={numero(resumo?.totais.manutencoes)}
          description="Somando todas as oficinas"
          icon={<Wrench size={19} />}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Contas cadastradas
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              {carregando
                ? "Carregando..."
                : `${totalRegistros} conta(s) encontrada(s)`}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou oficina..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full tabela-cartoes">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Conta
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Tipo / conta
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Cadastro
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Último acesso
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  E-mail
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Uso
                </th>
                <th className="w-12 px-5 py-3" />
              </tr>
            </thead>

            <tbody>
              {contas.map((conta) => (
                <tr
                  key={conta.id}
                  className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900">
                        {conta.nome}
                        {conta.admin && (
                          <span className="ml-2 rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-blue-700">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="mt-1 break-all text-[10px] text-gray-400">
                        {conta.email}
                      </p>
                    </div>
                  </td>
                  <td
                    data-label="Tipo / conta"
                    className="px-5 py-4 text-xs text-gray-600"
                  >
                    <p>{conta.oficina ?? conta.conta ?? "—"}</p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {ROTULO_PERFIL[conta.perfil]}
                    </p>
                  </td>
                  <td
                    data-label="Cadastro"
                    className="px-5 py-4 text-xs text-gray-500"
                  >
                    {formatarDataHora(conta.cadastroEm)}
                  </td>
                  <td
                    data-label="Último acesso"
                    className="px-5 py-4 text-xs text-gray-500"
                  >
                    {conta.ultimoAcessoEm
                      ? formatarDataHora(conta.ultimoAcessoEm)
                      : "Nunca entrou"}
                  </td>
                  <td data-label="E-mail" className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        conta.emailConfirmado
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {conta.emailConfirmado ? "Confirmado" : "Pendente"}
                    </span>
                  </td>
                  <td
                    data-label="Uso"
                    className="px-5 py-4 text-[11px] text-gray-500"
                  >
                    <p>
                      {conta.totais.clientes} cliente(s) ·{" "}
                      {conta.totais.veiculos} veículo(s)
                    </p>
                    <p className="mt-1">
                      {conta.totais.ordensServico} OS ·{" "}
                      {conta.totais.manutencoes} manutenção(ões)
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setVerConteudoDe(conta.id)}
                        title="Ver o que este usuário cadastrou (fica registrado)"
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50"
                      >
                        <Eye size={13} />
                        Ver conteúdo
                      </button>
                      {!conta.emailConfirmado && (
                        <button
                          type="button"
                          onClick={() => void reenviarConfirmacao(conta)}
                          disabled={reenviandoId === conta.id}
                          title="Reenviar e-mail de confirmação"
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send size={13} />
                          {reenviandoId === conta.id
                            ? "Enviando..."
                            : "Reenviar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!carregando && contas.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-xs text-gray-400"
                  >
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <p className="text-[11px] text-gray-400">
            Página {pagina} de {totalPaginas}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => irParaPagina(Math.max(1, pagina - 1))}
              disabled={pagina <= 1 || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>

            <button
              type="button"
              onClick={() => irParaPagina(Math.min(totalPaginas, pagina + 1))}
              disabled={pagina >= totalPaginas || carregando}
              className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 px-3 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <button
          type="button"
          onClick={alternarAcessos}
          className="flex w-full items-center gap-2 p-5 text-left"
        >
          <History size={16} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">
            Registro de acessos ao conteúdo
          </span>
          <span className="ml-auto text-[11px] text-gray-400">
            {acessos === null ? "Mostrar" : "Ocultar"}
          </span>
        </button>

        {acessos !== null && (
          <div className="overflow-x-auto border-t border-gray-100">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-2 text-[10px] font-semibold uppercase text-gray-500">Quando</th>
                  <th className="px-5 py-2 text-[10px] font-semibold uppercase text-gray-500">Quem viu</th>
                  <th className="px-5 py-2 text-[10px] font-semibold uppercase text-gray-500">De quem</th>
                  <th className="px-5 py-2 text-[10px] font-semibold uppercase text-gray-500">IP</th>
                </tr>
              </thead>
              <tbody>
                {acessos.map((acesso) => (
                  <tr key={acesso.id} className="border-t border-gray-100">
                    <td className="px-5 py-2 text-[11px] text-gray-600">{formatarDataHora(acesso.em)}</td>
                    <td className="px-5 py-2 text-[11px] text-gray-600">{acesso.admin.nome}</td>
                    <td className="px-5 py-2 text-[11px] text-gray-600">
                      {acesso.usuario.nome}{" "}
                      <span className="text-gray-400">({acesso.usuario.email})</span>
                    </td>
                    <td className="px-5 py-2 text-[11px] text-gray-400">{acesso.ip ?? "—"}</td>
                  </tr>
                ))}
                {acessos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-400">
                      Nenhum acesso registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {verConteudoDe !== null && (
        <ConteudoUsuario usuarioId={verConteudoDe} aoFechar={fecharConteudo} />
      )}
    </div>
  );
}
