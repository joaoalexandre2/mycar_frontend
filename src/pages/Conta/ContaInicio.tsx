import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Car, Plus, Wallet } from "lucide-react";
import { StatCard } from "../../components/dashboard/StatCard";
import { contaService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { formatarData, formatarMoeda } from "../../utils/formatters";
import type { ResumoConta, Vencimento } from "../../types/conta";

const ROTULO_TIPO = { ipva: "IPVA", licenciamento: "Licenciamento" } as const;

function textoDeDias(dias: number) {
  if (dias < 0) return `${Math.abs(dias)} dia(s) de atraso`;
  if (dias === 0) return "vence hoje";
  return `em ${dias} dia(s)`;
}

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

  return (
    <div className="p-4 md:p-8">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[21px] font-bold text-gray-900">
            Olá{primeiroNome ? `, ${primeiroNome}` : ""}!
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            {ehFrota
              ? `Visão geral da frota${usuario?.conta ? ` ${usuario.conta}` : ""}.`
              : "Veja como está o seu carro e o que vence em breve."}
          </p>
        </div>

        <Link
          to="/veiculos"
          className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700"
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

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title={ehFrota ? "Veículos da frota" : "Veículos"}
          value={resumo ? String(resumo.totalVeiculos) : "—"}
          description="Cadastrados na sua conta"
          icon={<Car size={19} />}
        />
        <StatCard
          title="Valor na tabela FIPE"
          value={resumo ? formatarMoeda(resumo.valorTotalFipe) : "—"}
          description="Soma dos veículos com valor consultado"
          icon={<Wallet size={19} />}
        />
        <StatCard
          title="Vencimentos próximos"
          value={resumo ? String(vencimentos.length) : "—"}
          description={
            resumo
              ? `IPVA e licenciamento nos próximos ${resumo.diasAFrente} dias`
              : "Carregando..."
          }
          icon={<CalendarClock size={19} />}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900">
            O que vence em breve
          </h3>
          <p className="mt-1 text-[11px] text-gray-400">
            As datas são <strong>estimativas</strong> pelo final da placa e
            variam por estado: confirme no site do Detran/Sefaz.
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
            {vencimentos.map((item) => (
              <li
                key={`${item.tipo}-${item.veiculoId}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {ROTULO_TIPO[item.tipo]} · {item.veiculo}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    Placa {item.placa}
                    {item.valorEstimado !== null &&
                      ` · valor estimado ${formatarMoeda(item.valorEstimado)}`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-900">
                    {formatarData(item.data)}
                  </p>
                  <p
                    className={`mt-1 text-[10px] ${
                      item.dias < 0 ? "font-semibold text-red-600" : "text-gray-400"
                    }`}
                  >
                    {textoDeDias(item.dias)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
