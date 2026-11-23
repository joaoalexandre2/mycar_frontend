import { CLASSES_DO_TOM } from "./tons";

/**
 * Falha ao carregar uma listagem. Fica no lugar do "nenhum registro": sem
 * isto, um servidor fora do ar parecia uma conta sem nada cadastrado.
 *
 * Não é um <Alert> (ocupa o lugar da lista, centralizado e com título), mas
 * usa os mesmos tokens do tom "danger", que mudam entre o claro e o escuro.
 */
export function ErroDeLista({
  mensagem,
  aoTentarDeNovo,
  titulo = "Não foi possível carregar a lista.",
}: {
  mensagem: string;
  aoTentarDeNovo: () => void;
  /** Para dados que não são uma lista (ex.: o formulário de Configurações). */
  titulo?: string;
}) {
  return (
    <div
      role="alert"
      data-tom="danger"
      className={`flex flex-col items-center gap-3 border-b px-5 py-8 text-center ${CLASSES_DO_TOM.danger}`}
    >
      <p className="text-sm font-semibold">{titulo}</p>

      <p className="max-w-md text-xs">{mensagem}</p>

      <button
        type="button"
        onClick={aoTentarDeNovo}
        className="h-9 rounded-lg bg-red-600 px-4 text-xs font-semibold text-white transition hover:bg-red-700"
      >
        Tentar de novo
      </button>
    </div>
  );
}
