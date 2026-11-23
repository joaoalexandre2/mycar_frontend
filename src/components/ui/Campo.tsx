import type { ComponentProps, ReactNode } from "react";
import { idDoErro } from "../../hooks/useErrosDeCampo";
import { ErroDoCampo } from "./ErroDoCampo";

/*
 * Campos de formulário com um só visual em todo o app.
 *
 * Altura: 44px no celular (alvo de toque recomendado) e 40px a partir do md.
 * Texto: 14px; em telas de toque o src/index.css sobe para 16px, o que evita o
 * zoom do iOS ao focar. O foco de teclado visível vem do :focus-visible global;
 * a borda azul no foco só reforça. Erro usa o tom "danger" (via aria-invalid,
 * que é o que o leitor de tela também anuncia) e o desabilitado fica apagado.
 */
const VISUAL_DO_CAMPO =
  "rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 aria-invalid:border-(--tom-danger-texto) disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

/** Input ou select que ocupa a largura toda (o caso dos formulários). */
export const classeDoCampo = `h-11 w-full md:h-10 ${VISUAL_DO_CAMPO}`;

/** Input ou select com a largura do conteúdo (filtros lado a lado). */
export const classeDoCampoEmLinha = `h-11 md:h-10 ${VISUAL_DO_CAMPO}`;

/** Textarea: sem altura fixa, com respiro vertical. */
export const classeDaAreaDeTexto = `w-full py-2 ${VISUAL_DO_CAMPO}`;

/** Rótulo acima do campo, no padrão dos formulários. */
export const classeDoRotulo = "mb-1.5 block text-xs font-medium text-gray-700";

type Largura = "total" | "auto";

function juntar(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function classePorLargura(largura: Largura) {
  return largura === "auto" ? classeDoCampoEmLinha : classeDoCampo;
}

interface PropsDeLargura {
  /** "total" (padrão) ocupa a linha; "auto" fica do tamanho do conteúdo. */
  largura?: Largura;
}

export function CampoDeTexto({ largura = "total", className, ...props }: ComponentProps<"input"> & PropsDeLargura) {
  return <input type="text" {...props} className={juntar(classePorLargura(largura), className)} />;
}

export function CampoDeData(props: Omit<ComponentProps<"input">, "type"> & PropsDeLargura) {
  return <CampoDeTexto {...props} type="date" />;
}

export function CampoSelect({ largura = "total", className, ...props }: ComponentProps<"select"> & PropsDeLargura) {
  return <select {...props} className={juntar(classePorLargura(largura), className)} />;
}

export function AreaDeTexto({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={juntar(classeDaAreaDeTexto, className)} />;
}

/** Atributos que o `Campo` entrega ao controle para ligá-lo ao rótulo, à ajuda e ao erro. */
export interface AtributosDoControle {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
}

interface PropsDoCampo {
  /** O `id` do controle; o rótulo aponta para ele com `htmlFor`. */
  id: string;
  rotulo: ReactNode;
  /** Dica fixa abaixo do campo. */
  ajuda?: ReactNode;
  /** Mensagem de erro; marca o controle com `aria-invalid`. */
  erro?: string;
  /** Mostra o asterisco (escondido do leitor, que ouve o `aria-required`). */
  obrigatorio?: boolean;
  className?: string;
  /** Recebe os atributos de acessibilidade e devolve o controle. */
  children: (atributos: AtributosDoControle) => ReactNode;
}

/** Id da dica fixa do campo `id`. */
function idDaAjuda(id: string) {
  return `${id}-ajuda`;
}

/**
 * Rótulo visível + controle + ajuda + erro, já ligados entre si.
 *
 * ```tsx
 * <Campo id="placa" rotulo="Placa" obrigatorio erro={erros.placa}>
 *   {(a) => <CampoDeTexto {...a} value={placa} onChange={...} />}
 * </Campo>
 * ```
 */
export function Campo({ id, rotulo, ajuda, erro, obrigatorio = false, className, children }: PropsDoCampo) {
  // O erro vem antes da ajuda na leitura, como em useErrosDeCampo.
  const descricao = juntar(erro && idDoErro(id), ajuda ? idDaAjuda(id) : undefined);

  return (
    <div className={className}>
      <label htmlFor={id} className={classeDoRotulo}>
        {rotulo}
        {obrigatorio && (
          <span aria-hidden="true" className="ml-0.5 text-(--tom-danger-texto)">
            *
          </span>
        )}
      </label>
      {children({
        id,
        "aria-describedby": descricao || undefined,
        "aria-invalid": erro ? true : undefined,
        "aria-required": obrigatorio ? true : undefined,
      })}
      {ajuda && (
        <p id={idDaAjuda(id)} className="mt-1 text-xs text-gray-500">
          {ajuda}
        </p>
      )}
      <ErroDoCampo campo={id} mensagem={erro} />
    </div>
  );
}
