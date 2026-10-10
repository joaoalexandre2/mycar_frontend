import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, ShieldCheck, Wrench } from "lucide-react";
import { Quadro } from "../../components/dashboard/Quadro";
import { Velocimetro } from "../../components/dashboard/Velocimetro";
import { contaService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { formatarData, formatarKm, formatarMoeda } from "../../utils/formatters";
import type { ResumoConta, TipoVencimento, Vencimento } from "../../types/conta";

const ROTULO_TIPO = {
  ipva: "IPVA",
  licenciamento: "Licenciamento",
  revisao: "Revisão",
  seguro: "Fim do seguro",
  documento: "Documento",
  servico: "Serviço",
} as const;

/** Prazo a partir do qual o vencimento ganha destaque na cor principal. */
const DIAS_EM_BREVE = 15;
const KM_EM_BREVE = 1000;

function IconeDoTipo({ tipo }: { tipo: TipoVencimento }) {
  if (tipo === "seguro") return <ShieldCheck size={17} />;
  if (tipo === "servico" || tipo === "revisao") return <Wrench size={17} />;

  return <FileText size={17} />;
}

/** O número grande de um vencimento (dias ou km) e o quanto ele pede atenção. */
function prazoDoVencimento(item: Vencimento) {
  if (item.porKm) {
    const faltam = item.kmRestante ?? 0;

    return {
      numero: faltam <= 0 ? "já passou" : formatarKm(faltam),
      detalhe: item.proximaKm !== null && item.proximaKm !== undefined ? `aos ${formatarKm(item.proximaKm)}` : "",
      tom: faltam <= 0 ? "atrasado" : faltam <= KM_EM_BREVE ? "breve" : "normal",
    } as const;
  }

  return {
    numero: item.dias < 0 ? `${Math.abs(item.dias)} d atraso` : item.dias === 0 ? "hoje" : `${item.dias} d`,
    detalhe: formatarData(item.data),
    tom: item.dias < 0 ? "atrasado" : item.dias <= DIAS_EM_BREVE ? "breve" : "normal",
  } as const;
}

const CLASSE_DO_TOM = {
  atrasado: "text-red-600",
  breve: "text-blue-600",
  normal: "text-gray-900",
} as const;

export function ContaInicio() {
  const { usuario } = useAuth();
  const ehFrota = usuario?.perfil === "frota";

  const [resumo, setResumo] = useState<ResumoConta | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    contaService
      .resumo()
      .then((dados) => {
        if (!cancelado) setResumo(dados);
      })
      .catch((error) => {
        if (!cancelado) setErro(mensagemErro(error));
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const primeiroNome = usuario?.name?.split(" ")[0] ?? "";
  const vencimentos: Vencimento[] = resumo?.vencimentos ?? [];
  const kmPorLitro = resumo?.consumo.kmPorLitro ?? null;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[28px] leading-none font-bold tracking-wide text-gray-900 uppercase">
            Olá{primeiroNome ? `, ${primeiroNome}` : ""}
          </h2>
          <p className="mt-1.5 text-xs text-gray-500">
            {ehFrota
              ? `Visão geral da frota${usuario?.conta ? ` ${usuario.conta}` : ""}.`
              : "Veja como está o seu carro e o que vence em breve."}
          </p>
        </div>

        <Link
          to="/veiculos"
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          {ehFrota ? "Gerenciar veículos" : "Meus veículos"}
        </Link>
      </div>

      {erro && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {erro}
        </p>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="rounded-3xl bg-[#101419] p-5 text-white">
          <p className="text-[11px] font-medium tracking-[0.12em] text-[#9AA3AE] uppercase">
            Consumo médio
          </p>

          <div className="mx-auto mt-2 max-w-[320px]">
            <Velocimetro valor={kmPorLitro} />
          </div>

          {resumo && kmPorLitro === null && (
            <p className="mt-3 rounded-xl bg-white/5 px-3 py-2.5 text-center text-[11px] leading-relaxed text-[#C9D0D8]">
              Registre 2 abastecimentos com tanque cheio para ver o seu consumo.{" "}
              <Link to="/veiculos" className="font-semibold text-white underline underline-offset-2">
                Abrir meus veículos
              </Link>
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
            <div>
              <p className="text-[10px] tracking-[0.1em] text-[#9AA3AE] uppercase">Gasto no mês</p>
              <p className="font-display text-[26px] leading-tight font-semibold">
                {resumo ? formatarMoeda(resumo.gastoMes.total) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.1em] text-[#9AA3AE] uppercase">Preço do litro</p>
              <p className="font-display text-[26px] leading-tight font-semibold">
                {resumo?.consumo.precoMedioLitro != null ? formatarMoeda(resumo.consumo.precoMedioLitro) : "—"}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <Quadro
            titulo={ehFrota ? "Veículos da frota" : "Veículos"}
            valor={resumo ? String(resumo.totalVeiculos) : "—"}
            detalhe="Cadastrados na sua conta"
          />
          <Quadro
            titulo="Valor na FIPE"
            valor={resumo ? formatarMoeda(resumo.valorTotalFipe) : "—"}
            detalhe="Soma dos veículos consultados"
          />
          <Quadro
            titulo="Combustível no mês"
            valor={resumo ? formatarMoeda(resumo.gastoMes.combustivel) : "—"}
            detalhe="Abastecimentos registrados"
          />
          <Quadro
            titulo="Serviços no mês"
            valor={resumo ? formatarMoeda(resumo.gastoMes.servicos) : "—"}
            detalhe="Só os que têm valor informado"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h3 className="font-display text-xl leading-none font-bold tracking-wide text-gray-900 uppercase">
            O que vence em breve
            {resumo && <span className="ml-2 text-base text-gray-400">{vencimentos.length}</span>}
          </h3>
          <p className="mt-2 text-[11px] text-gray-400">
            O IPVA vence em <strong>janeiro</strong> e o licenciamento segue o
            final da placa. Datas e valores são <strong>estimativas</strong> e
            variam por estado: confirme no site do Detran/Sefaz. Cadastre o CRLV
            do veículo para usar a data real do licenciamento.
          </p>
        </div>

        {!resumo ? (
          <p className="p-5 text-xs text-gray-400">Carregando...</p>
        ) : resumo.totalVeiculos === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-gray-500">
              Você ainda não cadastrou nenhum veículo.
            </p>
            <Link
              to="/veiculos"
              className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Cadastrar o primeiro veículo
            </Link>
          </div>
        ) : vencimentos.length === 0 ? (
          <p className="p-5 text-xs text-gray-400">
            Nada vence nos próximos {resumo.diasAFrente} dias. Para ver as
            datas, informe o estado de emplacamento de cada veículo.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {vencimentos.map((item) => {
              const prazo = prazoDoVencimento(item);

              return (
                <li
                  key={`${item.tipo}-${item.rotulo ?? ""}-${item.veiculoId}-${item.data}`}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <IconeDoTipo tipo={item.tipo} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-gray-900">
                      {item.rotulo ?? ROTULO_TIPO[item.tipo]}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500">
                      {item.veiculo} · {item.placa}
                      {item.valorEstimado !== null &&
                        ` · estimado ${formatarMoeda(item.valorEstimado)}`}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`font-display text-2xl leading-none font-semibold ${CLASSE_DO_TOM[prazo.tom]}`}
                    >
                      {prazo.numero}
                    </p>
                    {prazo.detalhe && (
                      <p className="mt-1 text-[10px] text-gray-400">{prazo.detalhe}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
