import { useEffect, useState } from "react";
import { pessoasFrotaService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { formatarDataHora } from "../../utils/formatters";
import type { EventoDeAcesso } from "../../types/frota";

const ROTULO_DA_ACAO: Record<EventoDeAcesso["acao"], string> = {
  criou: "criou o grupo",
  editou: "editou o grupo",
  removeu: "removeu o grupo",
  convidou: "convidou",
  mudou_papel: "mudou o papel de",
};

/** Quem mudou acesso na frota e quando. Só o administrador vê. */
export function AcessosHistorico() {
  const [eventos, setEventos] = useState<EventoDeAcesso[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    pessoasFrotaService
      .acessos()
      .then((dados) => {
        if (!ativo) return;
        setEventos(dados);
        setErro(null);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, []);

  if (erro) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
        {erro}
      </p>
    );
  }

  if (eventos === null) {
    return <p className="text-xs text-gray-500">Carregando...</p>;
  }

  if (eventos.length === 0) {
    return <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-xs text-gray-500">Nenhuma mudança de acesso registrada ainda.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {eventos.map((e) => (
        <li key={e.id} className="px-5 py-3">
          <p className="text-xs text-gray-900">
            <span className="font-semibold">{e.ator ?? "Alguém"}</span> {ROTULO_DA_ACAO[e.acao]}{" "}
            <span className="font-semibold">{descreverAlvo(e)}</span>
          </p>
          <p className="text-xs text-gray-500">{formatarDataHora(e.quando)}</p>
        </li>
      ))}
    </ul>
  );
}

function descreverAlvo(e: EventoDeAcesso): string {
  const d = e.detalhes ?? {};

  if (e.acao === "mudou_papel") {
    return `${String(d.nome ?? "")}: ${String(d.de ?? "")} → ${String(d.para ?? "")}`;
  }

  if (e.acao === "convidou") {
    return `${String(d.nome ?? "")} como ${String(d.papel ?? "")}`;
  }

  const nome = (e.acao === "editou" ? (d.depois as { nome?: string } | undefined)?.nome : d.nome) ?? "";

  return String(nome);
}
