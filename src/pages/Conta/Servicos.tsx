import { useEffect, useState } from "react";
import { useConfirmar } from "../../hooks/useNotificacoes";
import { Link } from "react-router-dom";
import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { servicoService } from "../../services/conta";
import { SeletorDeVeiculo } from "../../components/conta/SeletorDeVeiculo";
import { useVeiculosDaConta } from "../../hooks/useVeiculosDaConta";
import { mensagemErro } from "../../services/api";
import { Quadro } from "../../components/dashboard/Quadro";
import { CartaoServico } from "./CartaoServico";
import { ServicoModal } from "./ServicoModal";
import {
  formatarData,
  formatarKm,
  formatarMoeda,
} from "../../utils/formatters";
import type {
  NaturezaServico,
  Servico,
  ServicosDaConta,
  SituacaoServico,
} from "../../types/conta";

const SITUACAO: Record<SituacaoServico, { texto: string; classe: string }> = {
  em_dia: { texto: "Em dia", classe: "bg-emerald-50 text-emerald-700" },
  vence_em_breve: { texto: "Trocar em breve", classe: "bg-amber-50 text-amber-700" },
  vencido: { texto: "Vencido", classe: "bg-red-50 text-red-600" },
  sem_aviso: { texto: "Sem aviso", classe: "bg-gray-100 text-gray-500" },
  anterior: { texto: "Anterior", classe: "bg-gray-100 text-gray-500" },
};

const NATUREZA: Record<NaturezaServico, string> = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
};

function textoProxima(item: Servico) {
  const partes: string[] = [];

  if (item.proximoEm) partes.push(formatarData(item.proximoEm));
  if (item.proximaKm !== null) partes.push(formatarKm(item.proximaKm));

  return partes.length > 0 ? partes.join(" ou ") : "—";
}

function textoRestante(item: Servico) {
  const partes: string[] = [];

  if (item.diasRestantes !== null) {
    partes.push(
      item.diasRestantes < 0
        ? `${Math.abs(item.diasRestantes)} dia(s) de atraso`
        : item.diasRestantes === 0
          ? "vence hoje"
          : `em ${item.diasRestantes} dia(s)`,
    );
  }

  if (item.kmRestante !== null) {
    partes.push(
      item.kmRestante <= 0
        ? `passou ${formatarKm(Math.abs(item.kmRestante))}`
        : `faltam ${formatarKm(item.kmRestante)}`,
    );
  }

  return partes.join(" · ");
}

export function Servicos() {
  const pedirConfirmacao = useConfirmar();
  const [dados, setDados] = useState<ServicosDaConta | null>(null);
  const veiculosDaConta = useVeiculosDaConta();
  const [filtroVeiculo, setFiltroVeiculo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  // Modal aberto: { servico: null } para um novo, ou o serviço a editar.
  const [modal, setModal] = useState<{ servico: Servico | null } | null>(null);

  useEffect(() => {
    let ativo = true;

    servicoService
      .listar()
      .then((servicos) => {
        if (ativo) setDados(servicos);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, []);

  function recarregar() {
    servicoService
      .listar()
      .then(setDados)
      .catch((error) => setErro(mensagemErro(error)));
  }

  async function remover(item: Servico) {
    if (!(await pedirConfirmacao({
      mensagem: `Remover "${item.rotulo}" do histórico?`,
      confirmarTexto: "Remover",
      perigo: true,
    }))) return;

    try {
      setDados(await servicoService.remover(item.id));
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  const lista = (dados?.servicos ?? []).filter(
    (s) => !filtroVeiculo || String(s.veiculoContaId) === filtroVeiculo,
  );

  // Só o serviço mais recente de cada tipo vale para o aviso: esses viram cartões.
  // Os mais urgentes primeiro (vencido, depois "em breve", depois em dia).
  const ORDEM: Record<SituacaoServico, number> = {
    vencido: 0,
    vence_em_breve: 1,
    em_dia: 2,
    sem_aviso: 3,
    anterior: 4,
  };
  const vigentes = lista
    .filter((s) => s.vigente)
    .sort((a, b) => ORDEM[a.situacao] - ORDEM[b.situacao]);
  const contar = (situacao: SituacaoServico) =>
    vigentes.filter((s) => s.situacao === situacao).length;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[28px] leading-none font-bold tracking-wide text-gray-900 uppercase">
            Serviços
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Troca de óleo, bateria, palhetas e outros serviços, com aviso da
            próxima vez por prazo ou por quilometragem.
          </p>
        </div>

        <button
          onClick={() => setModal({ servico: null })}
          disabled={veiculosDaConta.total === 0}
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={18} />
          Novo serviço
        </button>
      </div>

      {erro && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {erro}
        </p>
      )}

      {dados && vigentes.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3 sm:gap-4">
            <Quadro
              titulo="Vencidos"
              valor={contar("vencido")}
              tom={contar("vencido") > 0 ? "perigo" : "normal"}
            />
            <Quadro
              titulo="Em breve"
              valor={contar("vence_em_breve")}
              tom={contar("vence_em_breve") > 0 ? "alerta" : "normal"}
            />
            <Quadro titulo="Em dia" valor={contar("em_dia")} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {vigentes.map((servico) => (
              <CartaoServico key={servico.id} servico={servico} />
            ))}
          </div>
        </>
      )}

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl leading-none font-bold tracking-wide text-gray-900 uppercase">
              Histórico
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              O aviso vale para o serviço mais recente de cada tipo. O km atual
              vem dos abastecimentos e serviços que você registrou.
            </p>
          </div>

          {veiculosDaConta.total > 1 && (
            <div className="w-full sm:w-72">
              <SeletorDeVeiculo
                valor={filtroVeiculo}
                rotulo="Filtrar por veículo"
                opcaoVazia="Todos os veículos"
                aoMudar={(id) => setFiltroVeiculo(id)}
              />
            </div>
          )}
        </div>

        {!dados || !veiculosDaConta.carregado ? (
          erro ? null : <p className="p-5 text-xs text-gray-500">Carregando...</p>
        ) : veiculosDaConta.total === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-gray-500">
              Cadastre um veículo para registrar serviços.
            </p>
            <Link
              to="/veiculos"
              className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Cadastrar veículo
            </Link>
          </div>
        ) : lista.length === 0 ? (
          <p className="p-5 text-xs text-gray-500">
            Nenhum serviço registrado ainda. Clique em “Novo serviço” e informe,
            por exemplo, a última troca de óleo.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tabela-cartoes">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Serviço", "Veículo", "Feito em", "Próxima troca", "Situação"].map(
                    (titulo) => (
                      <th
                        key={titulo}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {titulo}
                      </th>
                    ),
                  )}
                  <th className="w-24 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {lista.map((item) => {
                  const situacao = SITUACAO[item.situacao];

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 last:border-0 ${
                        item.vigente ? "" : "opacity-60"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Wrench size={17} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">
                              {item.rotulo}
                            </p>
                            {(item.natureza || item.oficina) && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                {[item.natureza && NATUREZA[item.natureza], item.oficina]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                            {item.valor !== null && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                {formatarMoeda(item.valor)}
                              </p>
                            )}
                            {item.observacoes && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                {item.observacoes}
                              </p>
                            )}
                            {item.anexos.length > 0 && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                {item.anexos.length} anexo(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="Veículo" className="px-5 py-4 text-xs text-gray-600">
                        {item.veiculo}
                        <span className="block text-xs text-gray-500">
                          {item.placa}
                        </span>
                      </td>
                      <td data-label="Feito em" className="px-5 py-4 text-xs text-gray-600">
                        {formatarData(item.realizadoEm)}
                        {item.km !== null && (
                          <span className="block text-xs text-gray-500">
                            {formatarKm(item.km)}
                          </span>
                        )}
                      </td>
                      <td data-label="Próxima troca" className="px-5 py-4 text-xs text-gray-600">
                        {item.vigente ? textoProxima(item) : "—"}
                        {item.vigente && textoRestante(item) && (
                          <span className="block text-xs text-gray-500">
                            {textoRestante(item)}
                          </span>
                        )}
                      </td>
                      <td data-label="Situação" className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${situacao.classe}`}
                        >
                          {situacao.texto}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setModal({ servico: item })}
                            aria-label={`Editar serviço ${item.titulo ?? item.rotulo}`}
                            title="Editar"
                            className="-m-3 p-3 text-gray-500 transition hover:text-blue-600"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void remover(item)}
                            aria-label={`Remover serviço ${item.titulo ?? item.rotulo}`}
                            title="Remover"
                            className="-m-3 p-3 text-gray-500 transition hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && dados && (
        <ServicoModal
          servico={modal.servico}
          veiculoInicial={veiculosDaConta.primeiro}
          tipos={dados.tipos}
          onClose={() => setModal(null)}
          onSalvo={(novo) => {
            setDados(novo);
            setModal(null);
          }}
          onAnexosMudaram={recarregar}
        />
      )}
    </div>
  );
}
