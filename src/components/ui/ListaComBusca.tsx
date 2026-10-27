import { useId, useState, type KeyboardEvent } from "react";

export interface OpcaoDaLista {
  codigo: string;
  nome: string;
}

interface Props {
  /** Código da opção escolhida ("" = nada escolhido). */
  valor: string;
  opcoes: OpcaoDaLista[];
  placeholder: string;
  /** Nome acessível do campo. */
  rotulo: string;
  desabilitado?: boolean;
  onChange: (codigo: string) => void;
}

/** Mais que isso a lista fica pesada de rolar; a pessoa afina digitando. */
const LIMITE_DE_ITENS = 100;

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Campo com busca para escolher numa lista que já está na tela (a busca é
 * feita aqui, sem pedir nada ao servidor). Digitar filtra: todas as palavras
 * digitadas precisam aparecer no item, sem ligar para acento ou maiúscula.
 */
export function ListaComBusca({ valor, opcoes, placeholder, rotulo, desabilitado = false, onChange }: Props) {
  const idLista = useId();
  const [texto, setTexto] = useState("");
  const [digitou, setDigitou] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [indice, setIndice] = useState(0);

  const escolhida = opcoes.find((opcao) => opcao.codigo === valor);
  const termos = digitou ? normalizar(texto).split(/\s+/).filter(Boolean) : [];

  const filtradas = opcoes.filter((opcao) => {
    const nome = normalizar(opcao.nome);
    return termos.every((termo) => nome.includes(termo));
  });
  const visiveis = filtradas.slice(0, LIMITE_DE_ITENS);

  function fechar() {
    setAberto(false);
    setDigitou(false);
  }

  function escolher(opcao: OpcaoDaLista) {
    fechar();
    onChange(opcao.codigo);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setAberto(true);
      setIndice((atual) => Math.min(atual + 1, Math.max(visiveis.length - 1, 0)));
    } else if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndice((atual) => Math.max(atual - 1, 0));
    } else if (evento.key === "Enter" && aberto) {
      // Com a lista aberta, Enter escolhe o item (não envia o formulário).
      evento.preventDefault();
      const opcao = visiveis[indice];
      if (opcao) escolher(opcao);
    } else if (evento.key === "Escape" && aberto) {
      evento.stopPropagation();
      fechar();
    }
  }

  const idDaOpcao = (posicao: number) => `${idLista}-${posicao}`;

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-label={rotulo}
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={aberto && visiveis.length > 0 ? idDaOpcao(indice) : undefined}
        autoComplete="off"
        disabled={desabilitado}
        value={digitou ? texto : (escolhida?.nome ?? "")}
        placeholder={placeholder}
        onFocus={(evento) => {
          setAberto(true);
          evento.target.select();
        }}
        onClick={() => setAberto(true)}
        onChange={(evento) => {
          setTexto(evento.target.value);
          setDigitou(true);
          setAberto(true);
          setIndice(0);
        }}
        onKeyDown={aoTeclar}
        onBlur={fechar}
        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      />

      {aberto && !desabilitado && (
        <ul
          id={idLista}
          role="listbox"
          aria-label={rotulo}
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-xs shadow-lg"
        >
          {visiveis.length === 0 && <li className="px-3 py-2 text-gray-500">Nenhum resultado.</li>}

          {visiveis.map((opcao, posicao) => (
            <li
              key={opcao.codigo}
              id={idDaOpcao(posicao)}
              role="option"
              aria-selected={opcao.codigo === valor}
              // mouseDown (e não click): roda antes do blur do campo.
              onMouseDown={(evento) => {
                evento.preventDefault();
                escolher(opcao);
              }}
              className={`cursor-pointer px-3 py-2 ${posicao === indice ? "bg-blue-50 text-blue-700" : "text-gray-700"}`}
            >
              {opcao.nome}
            </li>
          ))}

          {filtradas.length > visiveis.length && (
            <li className="px-3 py-2 text-xs text-gray-500">
              Mostrando {visiveis.length} de {filtradas.length}. Digite para afinar a busca.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
