/**
 * Falha ao carregar uma listagem. Fica no lugar do "nenhum registro": sem
 * isto, um servidor fora do ar parecia uma conta sem nada cadastrado.
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
      className="flex flex-col items-center gap-3 border-b border-red-200 bg-red-50 px-5 py-8 text-center"
    >
      <p className="text-sm font-semibold text-red-800">{titulo}</p>

      <p className="max-w-md text-xs text-red-800">{mensagem}</p>

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
