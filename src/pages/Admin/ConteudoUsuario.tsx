import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import {
  adminConteudoService,
  type ConteudoUsuario as Conteudo,
} from "../../services/admin";
import { mensagemErro } from "../../services/api";
import { Modal } from "../../components/ui/Modal";

interface ConteudoUsuarioProps {
  usuarioId: number;
  aoFechar: () => void;
}

/** "oleo_viscosidade" vira "Oleo viscosidade". */
function rotuloDaColuna(chave: string): string {
  const texto = chave.replace(/_/g, " ");

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "object") return JSON.stringify(valor);

  return String(valor);
}

/**
 * Visão de suporte: o que o usuário cadastrou, só para leitura. Abrir esta tela
 * grava um registro no servidor (quem viu, de quem, quando).
 */
export function ConteudoUsuario({ usuarioId, aoFechar }: ConteudoUsuarioProps) {
  const [conteudo, setConteudo] = useState<Conteudo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState(0);

  useEffect(() => {
    let cancelado = false;

    adminConteudoService
      .conteudo(usuarioId)
      .then((dados) => {
        if (!cancelado) setConteudo(dados);
      })
      .catch((e) => {
        if (!cancelado) setErro(mensagemErro(e));
      });

    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  const secao = conteudo?.secoes[aba];
  const colunas = secao ? Array.from(new Set(secao.linhas.flatMap((l) => Object.keys(l)))) : [];

  return (
    <Modal
      titulo={conteudo ? conteudo.usuario.nome : "Conteúdo do usuário"}
      subtitulo={
        conteudo
          ? `${conteudo.usuario.email} · perfil ${conteudo.usuario.perfil}`
          : undefined
      }
      larguraMax="max-w-6xl"
      onClose={aoFechar}
    >

      <p className="mx-5 mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        Somente leitura. Esta consulta foi registrada (quem viu, de quem e quando).
        Contém dados pessoais de terceiros: use apenas para suporte.
      </p>

      {erro && (
        <p role="alert" className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {erro}
        </p>
      )}

      {!conteudo && !erro && <p className="p-5 text-xs text-gray-500">Carregando...</p>}

      {conteudo && (
        <>
          <div className="flex gap-1 overflow-x-auto px-5 pt-4" role="tablist">
            {conteudo.secoes.map((s, i) => (
              <button
                key={s.chave}
                type="button"
                role="tab"
                aria-selected={i === aba}
                onClick={() => setAba(i)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  i === aba ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s.titulo} ({s.total})
              </button>
            ))}
          </div>

          <div className="p-5">
            {secao && secao.linhas.length === 0 && (
              <p className="py-8 text-center text-xs text-gray-500">Nada cadastrado nesta seção.</p>
            )}

            {secao && secao.linhas.length > 0 && (
              <>
                {secao.total > secao.linhas.length && (
                  <p className="mb-2 text-xs text-gray-500">
                    Mostrando as {secao.linhas.length} mais recentes de {secao.total}.
                  </p>
                )}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {colunas.map((c) => (
                          <th
                            key={c}
                            className="whitespace-nowrap px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
                          >
                            {rotuloDaColuna(c)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {secao.linhas.map((linha, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          {colunas.map((c) => (
                            <td key={c} className="max-w-[260px] truncate px-3 py-2 text-xs text-gray-700 select-text">
                              <span title={formatarValor(linha[c])}>{formatarValor(linha[c])}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
