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

/** Maior valor em reais que o backend aceita nos campos de dinheiro da frota (`max:99999999`). */
export const MAXIMO_EM_REAIS = 99_999_999;

/**
 * Quantos dígitos vêm depois do separador decimal, pelas mesmas regras de
 * lerNumeroBR (o número lido não serve: "2,500" vira 2,5 e perde os zeros).
 * Só chamar com texto que lerNumeroBR já leu como "ok".
 */
function casasDecimaisDigitadas(texto: string): number {
  const limpo = texto.replace(/R\$/gi, "").replace(/\s/g, "");
  const ultimaVirgula = limpo.lastIndexOf(",");
  const ultimoPonto = limpo.lastIndexOf(".");
  let posicaoDoDecimal: number;

  if (ultimaVirgula >= 0) {
    // Com vírgula, o decimal é o último separador (vírgula ou ponto).
    posicaoDoDecimal = Math.max(ultimaVirgula, ultimoPonto);
  } else if (ultimoPonto >= 0 && !MILHAR_COM_PONTO.test(limpo)) {
    posicaoDoDecimal = ultimoPonto;
  } else {
    return 0;
  }

  return limpo.length - posicaoDoDecimal - 1;
}

export type ValorEmReaisLido =
  | { estado: "vazio" }
  | { estado: "invalido"; mensagem: string }
  | { estado: "ok"; valor: number };

/**
 * Lê um valor em dinheiro digitado ou colado de planilha, com lerNumeroBR.
 *
 * - "1500,50", "1.500,50" e "1500.50" viram 1500,5;
 * - "2.500" é dois mil e quinhentos (ponto separando grupo de três é milhar,
 *   como se escreve no Brasil);
 * - mais de duas casas decimais ("2,500", "0.500", "1500,505") é recusado:
 *   dinheiro tem centavos, e "2,500" tanto pode ser 2,5 quanto 2500 colado de
 *   planilha em inglês. Melhor perguntar do que gravar o número errado;
 * - sinal de menos é recusado (o backend pede `min:0`); zero é aceito aqui, e
 *   o formulário que exige valor maior que zero confere à parte.
 */
export function lerValorEmReais(texto: string): ValorEmReaisLido {
  const lido = lerNumeroBR(texto);

  if (lido.estado === "vazio") {
    return lido;
  }

  if (lido.estado === "invalido") {
    if (texto.includes("-")) {
      return { estado: "invalido", mensagem: "O valor não pode ser negativo." };
    }

    return { estado: "invalido", mensagem: "Use só números, como 1.500,50." };
  }

  if (casasDecimaisDigitadas(texto) > 2) {
    return {
      estado: "invalido",
      mensagem: "Use no máximo duas casas decimais, como 1.500,50.",
    };
  }

  if (lido.valor > MAXIMO_EM_REAIS) {
    return { estado: "invalido", mensagem: "O valor máximo é R$ 99.999.999,00." };
  }

  return lido;
}

/**
 * Valor vindo do servidor (número ou texto decimal como "130.16") no formato
 * que o campo mostra e que lerValorEmReais lê de volta sem mudar o número:
 * 1500.5 vira "1500,50". Sem valor, o campo fica vazio.
 */
export function valorEmReaisParaCampo(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  const numero = Number(valor);

  return Number.isFinite(numero) ? numero.toFixed(2).replace(".", ",") : "";
}
