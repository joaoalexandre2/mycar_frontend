import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, FileText, Info, Plus, ShieldCheck, Wrench } from "lucide-react";
import { Quadro } from "../../components/dashboard/Quadro";
import { Velocimetro } from "../../components/dashboard/Velocimetro";
import { contaService } from "../../services/conta";
import { mensagemErro } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { formatarData, formatarKm, formatarMoeda } from "../../utils/formatters";
import { mensagemKmDesconhecida, podeInformarKm, situacaoPorKm } from "../../utils/avisoPorKm";
import type { ResumoConta, TipoVencimento, Vencimento } from "../../types/conta";
import { Alert } from "../../components/ui/Alert";

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

/** Abaixo de md, quantos vencimentos a lista mostra antes do "Ver todos". */
const VISIVEIS_NO_CELULAR = 2;

function IconeDoTipo({ tipo }: { tipo: TipoVencimento }) {
  if (tipo === "seguro") return <ShieldCheck size={17} />;
  if (tipo === "servico" || tipo === "revisao") return <Wrench size={17} />;

  return <FileText size={17} />;
}

/** O número grande de um vencimento (dias ou km) e o quanto ele pede atenção. */
function prazoDoVencimento(item: Vencimento) {
  if (item.porKm) {
    const situacao = situacaoPorKm(item.kmRestante);
    const detalhe = item.proximaKm !== null && item.proximaKm !== undefined ? `aos ${formatarKm(item.proximaKm)}` : "";

    // Sem a km do veículo não há como dizer que passou: pede a km.
    if (situacao.tipo === "desconhecida") {
      return { numero: "sem km", detalhe, tom: "normal", kmDesconhecida: true } as const;
    }

    const faltam = situacao.faltam;

    return {
      numero: situacao.tipo === "passou" ? "já passou" : formatarKm(faltam),
      detalhe,
      tom: situacao.tipo === "passou" ? "atrasado" : faltam <= KM_EM_BREVE ? "breve" : "normal",
      kmDesconhecida: false,
    } as const;
  }

  return {
    numero: item.dias < 0 ? `${Math.abs(item.dias)} d atraso` : item.dias === 0 ? "hoje" : `${item.dias} d`,
    detalhe: formatarData(item.data),
    tom: item.dias < 0 ? "atrasado" : item.dias <= DIAS_EM_BREVE ? "breve" : "normal",
    kmDesconhecida: false,
  } as const;
}

const CLASSE_DO_TOM = {
  atrasado: "text-(--tom-danger-texto)",
  // Âmbar, não "blue": a escala blue é a cor da marca (vermelha) e ficaria
  // igual ao "atrasado".
  breve: "text-(--tom-warning-texto)",
  normal: "text-gray-900",
} as const;

export function ContaInicio() {
  const { usuario } = useAuth();
  const ehFrota = usuario?.perfil === "frota";

  const [resumo, setResumo] = useState<ResumoConta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Só valem abaixo de md: a partir de md o aviso e a lista ficam sempre abertos.
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [listaAberta, setListaAberta] = useState(false);

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
      {/* Abaixo de md tudo é compacto para a tela inicial caber sem rolar; a
          partir de md a página é a mesma de antes. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 max-md:mb-3">
        <div className="min-w-0">
          <h2 className="font-display text-[28px] leading-none font-bold tracking-wide text-gray-900 uppercase max-md:text-[22px]">
            Olá{primeiroNome ? `, ${primeiroNome}` : ""}
          </h2>
          {/* No celular o subtítulo sai da vista, mas o leitor de tela continua lendo. */}
          <p className="mt-1.5 text-xs text-gray-500 max-md:sr-only">
            {ehFrota
              ? `Visão geral da frota${usuario?.conta ? ` ${usuario.conta}` : ""}.`
              : "Veja como está o seu carro e o que vence em breve."}
          </p>
        </div>

        <Link
          to="/veiculos"
          aria-label={ehFrota ? "Gerenciar veículos" : undefined}
          className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 max-md:h-11"
        >
          <Plus size={18} aria-hidden="true" />
          {ehFrota ? (
            <>
              <span className="max-md:hidden">Gerenciar veículos</span>
              <span aria-hidden="true" className="md:hidden">
                Veículos
              </span>
            </>
          ) : (
            "Meus veículos"
          )}
        </Link>
      </div>

      {erro && (
        <Alert tone="danger" className="mb-5">
          {erro}
        </Alert>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 max-md:mb-3 max-md:gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="rounded-3xl bg-[#101419] p-5 text-white max-md:rounded-2xl max-md:p-4">
          <p className="text-xs font-medium tracking-[0.12em] text-[#9AA3AE] uppercase">
            Consumo médio
          </p>

          {/* Celular: velocímetro pequeno à esquerda e os dois valores empilhados à
              direita; a dica (quando há) vai para a linha de baixo só na vista. A
              ordem do DOM (velocímetro, dica, valores) não muda. */}
          <div className="max-md:mt-2 max-md:grid max-md:grid-cols-[136px_minmax(0,1fr)] max-md:items-center max-md:gap-x-4">
            <div className="mx-auto mt-2 max-w-[320px] max-md:mx-0 max-md:mt-0 max-md:w-full">
              <Velocimetro valor={kmPorLitro} compactoNoCelular />
            </div>

            {resumo && kmPorLitro === null && (
              <p className="mt-3 rounded-xl bg-white/5 px-3 py-2.5 text-center text-xs leading-relaxed text-[#C9D0D8] max-md:col-span-2 max-md:row-start-2 max-md:py-2 max-md:text-left max-md:leading-snug">
                Registre 2 abastecimentos com tanque cheio para ver o seu consumo.{" "}
                <Link to="/veiculos" className="font-semibold text-white underline underline-offset-2">
                  Abrir meus veículos
                </Link>
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 max-md:col-start-2 max-md:row-start-1 max-md:mt-0 max-md:grid-cols-1 max-md:gap-1.5 max-md:border-t-0 max-md:pt-0">
              <div className="valor-fluido-pai">
                <p className="text-xs tracking-[0.1em] text-[#9AA3AE] uppercase max-md:tracking-[0.06em]">Gasto no mês</p>
                <p className="font-display valor-fluido leading-tight font-semibold [--valor-max:1.625rem]">
                  {resumo ? formatarMoeda(resumo.gastoMes.total) : "—"}
                </p>
              </div>
              <div className="valor-fluido-pai">
                <p className="text-xs tracking-[0.1em] text-[#9AA3AE] uppercase max-md:tracking-[0.06em]">Preço do litro</p>
                <p className="font-display valor-fluido leading-tight font-semibold [--valor-max:1.625rem]">
                  {resumo?.consumo.precoMedioLitro != null ? formatarMoeda(resumo.consumo.precoMedioLitro) : "—"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sempre 2 colunas (antes era 1 coluna abaixo de 420px). No celular o
            quadro usa rótulo curto e o detalhe fica só para o leitor de tela. */}
        <div className="grid grid-cols-2 gap-4 max-md:gap-3">
          <Quadro
            titulo={ehFrota ? "Veículos da frota" : "Veículos"}
            tituloCurto={ehFrota ? "Veículos" : undefined}
            valor={resumo ? String(resumo.totalVeiculos) : "—"}
            detalhe="Cadastrados na sua conta"
            compactoNoCelular
          />
          <Quadro
            titulo="Valor na FIPE"
            tituloCurto="FIPE"
            valor={resumo ? formatarMoeda(resumo.valorTotalFipe) : "—"}
            detalhe="Soma dos veículos consultados"
            compactoNoCelular
          />
          <Quadro
            titulo="Combustível no mês"
            tituloCurto="Combustível/mês"
            valor={resumo ? formatarMoeda(resumo.gastoMes.combustivel) : "—"}
            detalhe="Abastecimentos registrados"
            compactoNoCelular
          />
          <Quadro
            titulo="Serviços no mês"
            tituloCurto="Serviços/mês"
            valor={resumo ? formatarMoeda(resumo.gastoMes.servicos) : "—"}
            detalhe="Só os que têm valor informado"
            compactoNoCelular
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white max-md:rounded-2xl">
        <div className="border-b border-gray-200 p-5 max-md:py-0 max-md:pr-0.5 max-md:pl-4">
          <div className="max-md:flex max-md:items-center max-md:justify-between max-md:gap-2">
            <h3
              className="font-display text-xl leading-none font-bold tracking-wide text-gray-900 uppercase max-md:min-w-0 max-md:text-lg"
            >
              O que vence em breve
              {resumo && <span className="ml-2 text-base text-gray-500">{vencimentos.length}</span>}
            </h3>

            {/* Só no celular: o aviso longo vira este botão. O texto continua no
                DOM (sr-only quando fechado), então o leitor de tela sempre lê. */}
            <button
              type="button"
              onClick={() => setAvisoAberto((aberto) => !aberto)}
              aria-expanded={avisoAberto}
              aria-controls="aviso-vencimentos"
              aria-label="Estimativas: aviso sobre IPVA e licenciamento"
              title="Datas e valores são estimativas: confirme no Detran/Sefaz"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:-outline-offset-2 md:hidden"
            >
              <Info size={18} aria-hidden="true" />
            </button>
          </div>
          <p
            id="aviso-vencimentos"
            className={`mt-2 text-xs text-gray-500 ${avisoAberto ? "max-md:mt-0 max-md:pr-3.5 max-md:pb-3" : "max-md:sr-only"}`}
          >
            O IPVA vence em <strong>janeiro</strong> e o licenciamento segue o
            final da placa. Datas e valores são <strong>estimativas</strong> e
            variam por estado: confirme no site do Detran/Sefaz. Cadastre o CRLV
            do veículo para usar a data real do licenciamento.
          </p>
        </div>

        {!resumo ? (
          erro ? null : <p className="p-5 text-xs text-gray-500">Carregando...</p>
        ) : resumo.totalVeiculos === 0 ? (
          <div className="p-8 text-center max-md:p-5">
            <p className="text-xs text-gray-500">
              Você ainda não cadastrou nenhum veículo.
            </p>
            <Link
              to="/veiculos"
              className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:text-blue-700 max-md:mt-1 max-md:inline-flex max-md:min-h-11 max-md:items-center"
            >
              Cadastrar o primeiro veículo
            </Link>
          </div>
        ) : vencimentos.length === 0 ? (
          <p className="p-5 text-xs text-gray-500">
            Nada vence nos próximos {resumo.diasAFrente} dias. Para ver as
            datas, informe o estado de emplacamento de cada veículo.
          </p>
        ) : (
          <ul id="lista-vencimentos" className="divide-y divide-gray-100">
            {vencimentos.map((item, indice) => {
              const prazo = prazoDoVencimento(item);
              // No celular, fechada, a lista mostra só os primeiros; o resto
              // aparece no "Ver todos". A partir de md mostra todos, como antes.
              const escondidoNoCelular = !listaAberta && indice >= VISIVEIS_NO_CELULAR;

              return (
                <li
                  key={`${item.tipo}-${item.rotulo ?? ""}-${item.veiculoId}-${item.data}`}
                  className={`flex items-center gap-4 px-5 py-4 max-md:gap-3 max-md:px-4 max-md:py-1.5 ${escondidoNoCelular ? "max-md:hidden" : ""}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 max-md:h-9 max-md:w-9">
                    <IconeDoTipo tipo={item.tipo} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-gray-900">
                      {item.rotulo ?? ROTULO_TIPO[item.tipo]}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {item.veiculo} · {item.placa}
                      {item.valorEstimado !== null &&
                        ` · estimado ${formatarMoeda(item.valorEstimado)}`}
                    </p>
                    {prazo.kmDesconhecida && (
                      <p className="mt-1 text-xs text-gray-600">
                        {mensagemKmDesconhecida(item.veiculo, item.rotulo)}.
                        {podeInformarKm(usuario) && (
                          <>
                            {" "}
                            <Link
                              to="/veiculos"
                              className="font-semibold text-blue-600 hover:text-blue-700"
                            >
                              Informar km
                            </Link>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`font-display text-2xl leading-none font-semibold max-md:text-xl ${CLASSE_DO_TOM[prazo.tom]}`}
                    >
                      {prazo.numero}
                    </p>
                    {prazo.detalhe && (
                      <p className="mt-1 text-xs text-gray-500 max-md:mt-0.5">{prazo.detalhe}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Não há tela que liste todos os vencimentos da conta (o sininho corta
            em 8), então o "Ver todos" abre a lista aqui mesmo, só no celular.
            Sem resumo a lista é vazia, então o botão só aparece junto da lista. */}
        {vencimentos.length > VISIVEIS_NO_CELULAR && (
          <button
            type="button"
            onClick={() => setListaAberta((aberta) => !aberta)}
            aria-expanded={listaAberta}
            aria-controls="lista-vencimentos"
            className="flex h-11 w-full items-center justify-center gap-1 border-t border-gray-100 text-xs font-semibold text-blue-600 hover:bg-gray-50 hover:text-blue-700 focus-visible:-outline-offset-2 md:hidden"
          >
            {listaAberta ? "Ver menos" : `Ver todos (${vencimentos.length})`}
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`transition-transform ${listaAberta ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}
