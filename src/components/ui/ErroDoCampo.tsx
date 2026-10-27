import { idDoErro } from "../../hooks/useErrosDeCampo";

/** Mensagem de erro de um campo, logo abaixo dele. Nada quando não há erro. */
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
      className="mt-1 text-xs font-medium text-red-700"
    >
      {mensagem}
    </p>
  );
}
