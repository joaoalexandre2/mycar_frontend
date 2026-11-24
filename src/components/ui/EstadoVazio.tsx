import type { ReactNode } from "react";

/**
 * Lista ou período sem nenhum registro: um só desenho para todas as telas.
 *
 * - "caixa" (padrão): bloco cinza no lugar da lista.
 * - "linha": sem fundo, para ir dentro do <td colSpan> de uma tabela (a linha
 *   continua ocupando todas as colunas, no desktop e nos cartões do celular).
 *
 * O título e a ação ficam no mesmo bloco: quem chega ao aviso acha o próximo
 * passo logo em seguida.
 */
export function EstadoVazio({
  titulo,
  descricao,
  acao,
  variante = "caixa",
  className = "",
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  /** Um botão ou link para o próximo passo (ex.: "Reservar veículo"). */
  acao?: ReactNode;
  variante?: "caixa" | "linha";
  className?: string;
}) {
  const fundo = variante === "caixa" ? "rounded-lg bg-gray-50 px-4" : "px-5";

  return (
    <div data-estado-vazio="" className={`w-full space-y-3 py-6 text-center text-xs text-gray-500 ${fundo} ${className}`}>
      <p>{titulo}</p>
      {descricao && <p>{descricao}</p>}
      {acao}
    </div>
  );
}
