import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export interface OpcaoBusca {
  id: number;
  rotulo: string;
}

interface Props {
  /** Id selecionado, como texto ("" = nada selecionado). */
  valor: string;
  /** Texto do item já selecionado (ao editar um registro que já tem valor). */
  rotuloInicial?: string;
  placeholder: string;
  /** Busca no servidor: recebe o que foi digitado ("" = primeiros itens). */
  buscar: (termo: string) => Promise<OpcaoBusca[]>;
  onChange: (id: string) => void;
}

const ESPERA_DIGITACAO_MS = 300;

interface Resultado {
  termo: string;
  opcoes: OpcaoBusca[];
  falhou: boolean;
}

/**
 * Lista de seleção que busca no servidor enquanto se digita, no lugar de
 * baixar todos os registros para preencher um <select>.
 */
export function SelectComBusca({
  valor,
  rotuloInicial = "",
  placeholder,
  buscar,
  onChange,
}: Props) {
  const idLista = useId();
  const [texto, setTexto] = useState(rotuloInicial);
  const [digitou, setDigitou] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [termoEspera, setTermoEspera] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
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

  function escolher(opcao: OpcaoBusca) {
    setTexto(opcao.rotulo);
    setDigitou(false);
    setAberto(false);
    onChange(String(opcao.id));
  }

  function aoDigitar(novoTexto: string) {
    setTexto(novoTexto);
    setDigitou(true);
    setAberto(true);
    setIndice(0);

    // Mudou o texto: a escolha anterior deixa de valer.
    if (valor !== "") {
      onChange("");
    }
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setAberto(true);
      setIndice((atual) => Math.min(atual + 1, Math.max(opcoes.length - 1, 0)));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndice((atual) => Math.max(atual - 1, 0));
    } else if (evento.key === "Enter" && aberto) {
      // Com a lista aberta, Enter escolhe o item (não envia o formulário).
      evento.preventDefault();
      if (opcoes[indice]) escolher(opcoes[indice]);
    } else if (evento.key === "Escape" && aberto) {
      evento.stopPropagation();
      setAberto(false);
    }
  }

  function aoSair() {
    setAberto(false);

    // Texto digitado sem escolher nada não vale: limpa para não enganar.
    if (valor === "") {
      setTexto("");
      setDigitou(false);
    }
  }

  const ativoId = aberto && opcoes[indice] ? `${idLista}-${opcoes[indice].id}` : undefined;

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={ativoId}
        autoComplete="off"
        value={texto}
        placeholder={placeholder}
        onFocus={() => setAberto(true)}
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

          {opcoes.map((opcao, posicao) => (
            <li
              key={opcao.id}
              id={`${idLista}-${opcao.id}`}
              role="option"
              aria-selected={String(opcao.id) === valor}
              // mouseDown (e não click): roda antes do blur do campo.
              onMouseDown={(evento) => {
                evento.preventDefault();
                escolher(opcao);
              }}
              className={`cursor-pointer px-3 py-2 ${
                posicao === indice ? "bg-blue-50 text-blue-700" : "text-gray-700"
              }`}
            >
              {opcao.rotulo}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
