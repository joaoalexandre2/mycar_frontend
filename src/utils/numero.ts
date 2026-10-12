/** Resultado de ler um número digitado: vazio e inválido são coisas diferentes. */
export type NumeroLido =
  | { estado: "vazio" }
  | { estado: "invalido" }
  | { estado: "ok"; valor: number };

interface Opcoes {
  /**
   * "2.500" é dois mil e quinhentos (padrão, para dinheiro e km). Em campos
   * que costumam ter casas decimais com ponto (litros, psi), passe `false`
   * para que "38.500" seja 38,5.
   */
  pontoComoMilhar?: boolean;
}

const SO_CARACTERES_DE_NUMERO = /^[0-9.,]+$/;
const MILHAR_COM_PONTO = /^[1-9]\d{0,2}(\.\d{3})+$/;

/**
 * Lê um número escrito como no Brasil: "1.234,56", "1234,56", "2.500", "52,5".
 *
 * - vírgula é o separador decimal; ponto é milhar quando separa grupos de
 *   três dígitos ("2.500" = 2500, "10.500,90" = 10500,9);
 * - quando vêm os dois, o último é o decimal ("1.234,56" ou "1,234.56");
 * - ponto sozinho que não forma milhar é decimal ("2.5", "12.34", "0.500");
 * - tira "R$" e espaços; nada de letras, sinal ou notação científica.
 *
 * Nunca devolve NaN: texto que não é número vem como "invalido", para a tela
 * avisar em vez de gravar um valor errado ou perder o campo em silêncio.
 */
export function lerNumeroBR(texto: string, opcoes: Opcoes = {}): NumeroLido {
  const { pontoComoMilhar = true } = opcoes;

  const limpo = texto
    .replace(/R\$/gi, "")
    .replace(/\s/g, ""); // \s cobre espaço, tab e NBSP

  if (limpo === "") {
    return { estado: "vazio" };
  }

  if (!SO_CARACTERES_DE_NUMERO.test(limpo)) {
    return { estado: "invalido" };
  }

  const ultimaVirgula = limpo.lastIndexOf(",");
  const ultimoPonto = limpo.lastIndexOf(".");
  let normalizado: string;

  if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
    // Os dois aparecem: o que vem por último é o decimal.
    const decimal = ultimaVirgula > ultimoPonto ? "," : ".";
    const milhar = decimal === "," ? "." : ",";

    if (limpo.split(decimal).length > 2) {
      return { estado: "invalido" };
    }

    normalizado = limpo.split(milhar).join("").replace(decimal, ".");
  } else if (ultimaVirgula >= 0) {
    // Só vírgula: decimal, e uma só.
    if (limpo.split(",").length > 2) {
      return { estado: "invalido" };
    }

    normalizado = limpo.replace(",", ".");
  } else if (ultimoPonto >= 0) {
    if (pontoComoMilhar && MILHAR_COM_PONTO.test(limpo)) {
      normalizado = limpo.split(".").join("");
    } else if (limpo.split(".").length > 2) {
      return { estado: "invalido" };
    } else {
      normalizado = limpo;
    }
  } else {
    normalizado = limpo;
  }

  // Sobra algo como ".5" ou "5.": aceita; "." sozinho não é número.
  const valor = Number(normalizado);

  if (!Number.isFinite(valor) || normalizado === "." || normalizado === "") {
    return { estado: "invalido" };
  }

  return { estado: "ok", valor };
}

/** Como lerNumeroBR, mas só aceita número inteiro (km, por exemplo): "52,5" é inválido. */
export function lerInteiroBR(texto: string, opcoes: Opcoes = {}): NumeroLido {
  const lido = lerNumeroBR(texto, opcoes);

  if (lido.estado === "ok" && !Number.isInteger(lido.valor)) {
    return { estado: "invalido" };
  }

  return lido;
}
