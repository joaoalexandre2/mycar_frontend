import { useEffect, useState } from "react";
import { pessoasFrotaService } from "../../services/frota";
import { Alert } from "../../components/ui/Alert";
import { Carregando } from "../../components/ui/Carregando";
import { EstadoVazio } from "../../components/ui/EstadoVazio";
import { mensagemErro } from "../../services/api";
import { formatarDataHora } from "../../utils/formatters";
import type { EventoDeAcesso } from "../../types/frota";

const ROTULO_DA_ACAO: Record<EventoDeAcesso["acao"], string> = {
  criou: "criou o grupo",
  editou: "editou o grupo",
  removeu: "removeu o grupo",
  convidou: "convidou",
  mudou_papel: "mudou o papel de",
  salvou: "salvou o modelo",
  ligou_motorista: "ligou a um cadastro de motorista",
  reenviou_convite: "reenviou o convite para",
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
      <Alert tone="danger">
        {erro}
      </Alert>
    );
  }

  if (eventos === null) {
    return <Carregando />;
  }

  if (eventos.length === 0) {
    return <EstadoVazio titulo="Nenhuma mudança de acesso registrada ainda." />;
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

  if (e.acao === "ligou_motorista") {
    return `${String(d.nome ?? "")} → ${String(d.motorista ?? "")}${d.criou_cadastro ? " (cadastro criado)" : ""}`;
  }

  if (e.acao === "convidou") {
    return `${String(d.nome ?? "")} como ${String(d.papel ?? "")}`;
  }

  const nome = (e.acao === "editou" ? (d.depois as { nome?: string } | undefined)?.nome : d.nome) ?? "";

  return String(nome);
}
