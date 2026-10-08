import type { ReactNode } from "react";
import {
  Camera,
  Car,
  CircleDollarSign,
  FileText,
  Fuel,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { formatarData, formatarMoeda } from "../../utils/formatters";
import { diasAteData } from "../../utils/prazos";
import type { VeiculoConta } from "../../types/conta";

export interface AcoesDoVeiculo {
  atualizarFipe: () => void;
  fotos: () => void;
  despesas: () => void;
  documentos: () => void;
  seguro: () => void;
  abastecimentos: () => void;
  editar: () => void;
  remover: () => void;
}

function Botao({
  titulo,
  aoClicar,
  perigo = false,
  desabilitado = false,
  children,
}: {
  titulo: string;
  aoClicar: () => void;
  perigo?: boolean;
  desabilitado?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      disabled={desabilitado}
      title={titulo}
      aria-label={titulo}
      className={`flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition disabled:opacity-50 ${
        perigo
          ? "hover:bg-red-50 hover:text-red-600"
          : "hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      {children}
    </button>
  );
}

/** Um imposto: rótulo, valor estimado em fonte condensada e a data (cor principal se perto). */
function Imposto({
  rotulo,
  valor,
  vencimento,
}: {
  rotulo: string;
  valor: number | null;
  vencimento: string | null;
}) {
  const dias = vencimento ? diasAteData(vencimento) : null;
  const perto = dias !== null && dias <= 30;

  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
      <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
        {rotulo}
      </p>
      <p className="font-display text-xl leading-tight font-semibold text-gray-900">
        {valor !== null ? formatarMoeda(valor) : "—"}
      </p>
      {vencimento && (
        <p
          className={`mt-0.5 text-[10px] ${
            perto ? "font-semibold text-blue-600" : "text-gray-400"
          }`}
        >
          vence (est.) {formatarData(vencimento)}
        </p>
      )}
    </div>
  );
}

/**
 * Cartão de um veículo (estilo Pista): capa com a foto mais recente do álbum (ou o
 * desenho padrão), placa e nome por cima, valor FIPE em destaque, impostos estimados
 * e a fileira de ações.
 */
export function CartaoVeiculo({
  veiculo,
  nome,
  consultandoFipe,
  acoes,
}: {
  veiculo: VeiculoConta;
  nome: string;
  consultandoFipe: boolean;
  acoes: AcoesDoVeiculo;
}) {
  const temCodigoFipe = Boolean(
    veiculo.fipeMarcaId && veiculo.fipeModeloId && veiculo.fipeAno,
  );

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white">
      <div className="relative h-40 bg-[#1A1C23]">
        {veiculo.fotoCapaUrl ? (
          <img
            src={veiculo.fotoCapaUrl}
            alt={`Foto de ${nome}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <Car
            size={64}
            strokeWidth={1.2}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#3A3F4B]"
            aria-hidden="true"
          />
        )}

        <span className="absolute top-3 right-3 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-bold tracking-[0.18em] text-gray-900">
          {veiculo.placa}
        </span>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pt-8 pb-3">
          <h3 className="font-display truncate text-2xl leading-none font-bold tracking-wide text-white uppercase">
            {nome}
          </h3>
          <p className="mt-1 truncate text-[11px] text-white/75">
            {veiculo.marca} {veiculo.modelo} · {veiculo.anoCompleto}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
              Valor na FIPE
            </p>
            <p className="font-display text-[30px] leading-none font-bold text-gray-900">
              {veiculo.fipeValor !== null ? formatarMoeda(veiculo.fipeValor) : "—"}
            </p>
          </div>
          {veiculo.fipeValor !== null && veiculo.fipeConsultadoEm && (
            <p className="text-[10px] text-gray-400">
              em {formatarData(veiculo.fipeConsultadoEm)}
            </p>
          )}
        </div>

        {veiculo.uf ? (
          <div className="grid grid-cols-2 gap-2">
            <Imposto
              rotulo="IPVA"
              valor={veiculo.ipvaEstimado}
              vencimento={veiculo.proximoVencimentoIpva}
            />
            <Imposto
              rotulo="Licenciamento"
              valor={veiculo.licenciamentoValor}
              vencimento={veiculo.proximoVencimentoLicenciamento}
            />
          </div>
        ) : (
          <p className="rounded-xl bg-gray-50 px-3 py-2.5 text-[11px] text-gray-500">
            Informe o estado de emplacamento (editar) para ver o IPVA e o
            licenciamento estimados.
          </p>
        )}

        {veiculo.possivelIsencaoIpva && (
          <p className="text-[10px] text-amber-600">
            Carro com 15+ anos: alguns estados isentam o IPVA. Confira na Sefaz.
          </p>
        )}

        {veiculo.revisaoPrevistaEm && (
          <p className="text-[11px] text-gray-600">
            Revisão em{" "}
            <span className="font-semibold text-gray-900">
              {formatarData(veiculo.revisaoPrevistaEm)}
            </span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center">
            <Botao titulo="Abastecimentos e consumo" aoClicar={acoes.abastecimentos}>
              <Fuel size={16} />
            </Botao>
            <Botao titulo="Álbum de fotos" aoClicar={acoes.fotos}>
              <Camera size={16} />
            </Botao>
            <Botao titulo="Despesas: combustível, serviços e seguro" aoClicar={acoes.despesas}>
              <CircleDollarSign size={16} />
            </Botao>
            <Botao titulo="Documentos: CRLV e vencimentos" aoClicar={acoes.documentos}>
              <FileText size={16} />
            </Botao>
            <Botao titulo="Seguro: apólice e propostas" aoClicar={acoes.seguro}>
              <ShieldCheck size={16} />
            </Botao>
          </div>

          <div className="flex items-center">
            {temCodigoFipe && (
              <Botao
                titulo="Atualizar valor na FIPE"
                aoClicar={acoes.atualizarFipe}
                desabilitado={consultandoFipe}
              >
                <RefreshCw size={16} className={consultandoFipe ? "animate-spin" : ""} />
              </Botao>
            )}
            <Botao titulo="Editar" aoClicar={acoes.editar}>
              <Pencil size={16} />
            </Botao>
            <Botao titulo="Remover" aoClicar={acoes.remover} perigo>
              <Trash2 size={16} />
            </Botao>
          </div>
        </div>
      </div>
    </article>
  );
}
