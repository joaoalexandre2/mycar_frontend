import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export interface OpcaoBusca<T = unknown> {
  id: number;
  rotulo: string;
  /** O registro completo, devolvido a quem usa quando esta opção é escolhida. */
  dado?: T;
}

interface Props<T> {
  /** Id selecionado, como texto ("" = nada selecionado). */
  valor: string;
  /** Texto do item já selecionado (ao editar um registro que já tem valor). */
  rotuloInicial?: string;
  placeholder: string;
  /** Busca no servidor: recebe o que foi digitado ("" = primeiros itens). */
  buscar: (termo: string) => Promise<OpcaoBusca<T>[]>;
  /** `opcao` é a escolhida (ou null ao limpar/escolher a opção vazia). */
  onChange: (id: string, opcao: OpcaoBusca<T> | null) => void;
  /**
   * Opção fixa no topo que significa "nenhum" (ex.: "Todos os veículos"). Ao
   * escolhê-la o valor vira "" e o campo mostra este texto.
   */
  opcaoVazia?: string;
  /** Nome acessível do campo (quando não há um <label> ao redor). */
  rotulo?: string;
  /** `id` do campo: para o foco ir até ele quando a validação falha. */
  id?: string;
  /** Marca o campo como inválido e liga a mensagem de erro (`aria-describedby`). */
  invalido?: boolean;
  descritoPor?: string;
}

const ESPERA_DIGITACAO_MS = 300;

interface Resultado<T> {
  termo: string;
  opcoes: OpcaoBusca<T>[];
  falhou: boolean;
}

/**
 * Lista de seleção que busca no servidor enquanto se digita, no lugar de
 * baixar todos os registros para preencher um <select>.
 */
export function SelectComBusca<T = unknown>({
  valor,
  rotuloInicial = "",
  placeholder,
  buscar,
  onChange,
  opcaoVazia,
  rotulo,
  id,
  invalido,
  descritoPor,
}: Props<T>) {
  const idLista = useId();
  const [texto, setTexto] = useState(
    valor === "" && opcaoVazia ? opcaoVazia : rotuloInicial,
  );
  const [digitou, setDigitou] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [termoEspera, setTermoEspera] = useState("");
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const [indice, setIndice] = useState(0);
  const buscarRef = useRef(buscar);

  useEffect(() => {
    buscarRef.current = buscar;
  });

  // Enquanto não digitou nada, mostra os primeiros itens (e não só o que
  // casa com o nome do item já selecionado).
  const termoDigitado = digitou ? texto.trim() : "";

  // Pequena espera para não consultar a cada tecla.
  useEffect(() => {
    if (!aberto) {
      return;
    }

    const timer = setTimeout(
      () => setTermoEspera(termoDigitado),
      termoDigitado === "" ? 0 : ESPERA_DIGITACAO_MS,
    );

    return () => clearTimeout(timer);
  }, [aberto, termoDigitado]);

  useEffect(() => {
    if (!aberto) {
      return;
    }

    let ativo = true;

    buscarRef
      .current(termoEspera)
      .then((opcoes) => {
        if (ativo) setResultado({ termo: termoEspera, opcoes, falhou: false });
      })
      .catch(() => {
        if (ativo) setResultado({ termo: termoEspera, opcoes: [], falhou: true });
      });

    return () => {
      ativo = false;
    };
  }, [aberto, termoEspera]);

  const carregando =
    aberto && (termoEspera !== termoDigitado || resultado?.termo !== termoEspera);
  const opcoes = resultado?.opcoes ?? [];

  // A opção "nenhum" só aparece quando não se está filtrando por texto.
  const mostraVazia = Boolean(opcaoVazia) && termoDigitado === "";
  const total = opcoes.length + (mostraVazia ? 1 : 0);

  function escolher(opcao: OpcaoBusca<T>) {
    setTexto(opcao.rotulo);
    setDigitou(false);
    setAberto(false);
    onChange(String(opcao.id), opcao);
  }

  function escolherVazia() {
    setTexto(opcaoVazia ?? "");
    setDigitou(false);
    setAberto(false);
    onChange("", null);
  }

  function aoDigitar(novoTexto: string) {
    setTexto(novoTexto);
    setDigitou(true);
    setAberto(true);
    setIndice(0);

    // Mudou o texto: a escolha anterior deixa de valer.
    if (valor !== "") {
      onChange("", null);
    }
  }

  function escolherDoIndice(posicao: number) {
    if (mostraVazia) {
      if (posicao === 0) {
        escolherVazia();
        return;
      }

      const opcao = opcoes[posicao - 1];
      if (opcao) escolher(opcao);
      return;
    }

    const opcao = opcoes[posicao];
    if (opcao) escolher(opcao);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setAberto(true);
      setIndice((atual) => Math.min(atual + 1, Math.max(total - 1, 0)));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndice((atual) => Math.max(atual - 1, 0));
    } else if (evento.key === "Enter" && aberto) {
      // Com a lista aberta, Enter escolhe o item (não envia o formulário).
      evento.preventDefault();
      escolherDoIndice(indice);
    } else if (evento.key === "Escape" && aberto) {
      evento.stopPropagation();
      setAberto(false);
    }
  }

  function aoSair() {
    setAberto(false);

    // Texto digitado sem escolher nada não vale: volta ao que estava (a opção
    // "nenhum", quando existe) em vez de deixar um texto que engana.
    if (valor === "") {
      setTexto(opcaoVazia ?? "");
      setDigitou(false);
    }
  }

  const idDaOpcao = (posicao: number) => `${idLista}-${posicao}`;
  const ativoId = aberto && total > 0 ? idDaOpcao(indice) : undefined;

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-label={rotulo}
        aria-invalid={invalido ? true : undefined}
        aria-describedby={descritoPor}
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={ativoId}
        autoComplete="off"
        value={texto}
        placeholder={placeholder}
        onFocus={() => setAberto(true)}
        // Depois de escolher, o campo continua com o foco: clicar de novo reabre.
        onClick={() => setAberto(true)}
        onChange={(evento) => aoDigitar(evento.target.value)}
        onKeyDown={aoTeclar}
        onBlur={aoSair}
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-500"
      />

      {aberto && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-xs shadow-lg"
        >
          {mostraVazia && (
            <li
              id={idDaOpcao(0)}
              role="option"
              aria-selected={valor === ""}
              // mouseDown (e não click): roda antes do blur do campo.
              onMouseDown={(evento) => {
                evento.preventDefault();
                escolherVazia();
              }}
              className={`cursor-pointer px-3 py-2 ${
                indice === 0 ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`}
            >
              {opcaoVazia}
            </li>
          )}

          {carregando && opcoes.length === 0 && (
            <li className="px-3 py-2 text-gray-500">Buscando...</li>
          )}

          {!carregando && resultado?.falhou && (
            <li className="px-3 py-2 text-red-600">
              Não foi possível buscar agora.
            </li>
          )}

          {!carregando && !resultado?.falhou && opcoes.length === 0 && (
            <li className="px-3 py-2 text-gray-500">Nenhum resultado.</li>
          )}

          {opcoes.map((opcao, posicao) => {
            const posicaoNaLista = posicao + (mostraVazia ? 1 : 0);

            return (
              <li
                key={opcao.id}
                id={idDaOpcao(posicaoNaLista)}
                role="option"
                aria-selected={String(opcao.id) === valor}
                onMouseDown={(evento) => {
                  evento.preventDefault();
                  escolher(opcao);
                }}
                className={`cursor-pointer px-3 py-2 ${
                  posicaoNaLista === indice
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700"
                }`}
              >
                {opcao.rotulo}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
