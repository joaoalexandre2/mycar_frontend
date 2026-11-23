import { idDoErro } from "../../hooks/useErrosDeCampo";

/**
 * Mensagem de erro de um campo, logo abaixo dele. Nada quando não há erro.
 * Fica leve (só o texto, sem caixa) e usa a cor de texto do tom "danger".
 */
export function ErroDoCampo({
  campo,
  mensagem,
}: {
  /** O `id` do campo (o mesmo passado a `atributos`). */
  campo: string;
  mensagem?: string;
}) {
  if (!mensagem) {
    return null;
  }

  return (
    <p
      id={idDoErro(campo)}
      role="alert"
      data-tom="danger"
      className="mt-1 text-xs font-medium text-(--tom-danger-texto)"
    >
      {mensagem}
    </p>
  );
}
