import { LoaderCircle } from "lucide-react";

/**
 * Indicador discreto de carga dentro de uma tela (lista, diálogo, aba).
 *
 * role="status" já traz aria-live="polite": o leitor de tela anuncia o texto
 * sem interromper. O giro do ícone só acontece com motion-safe (quem pediu
 * menos movimento no sistema vê o ícone parado), e o texto continua visível,
 * então a informação não depende da animação.
 *
 * Para a carga do pacote de uma tela inteira, o app usa o CarregandoTela.
 */
export function Carregando({
  texto = "Carregando...",
  className = "",
}: {
  /** O que está carregando, quando ajuda (ex.: "Carregando o veículo..."). */
  texto?: string;
  className?: string;
}) {
  return (
    <p role="status" className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
      <LoaderCircle size={14} aria-hidden="true" className="shrink-0 motion-safe:animate-spin" />
      {texto}
    </p>
  );
}
