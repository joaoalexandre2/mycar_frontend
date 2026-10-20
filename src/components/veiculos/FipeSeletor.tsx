import { useEffect, useRef, useState } from "react";
import { anoDoCodigoFipe, fipeService, type FipeItem } from "../../services/fipe";
import { mensagemErro } from "../../services/api";

export interface FipeSelecao {
  marcaId: string;
  modeloId: string;
  ano: string;
}

export interface FipeNomes {
  marca?: string;
  modelo?: string;
  ano?: number;
}

const classeSelect =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

/**
 * Marca → ano → modelo. Escolher o ano antes filtra a lista: só aparecem os
 * modelos que a tabela FIPE tem naquele ano (e combustível), em vez de todos
 * os modelos da marca de todos os tempos.
 */
export function FipeSeletor({
  valor,
  onChange,
}: {
  valor: FipeSelecao;
  onChange: (selecao: FipeSelecao, nomes: FipeNomes) => void;
}) {
  const [inicial] = useState(valor);
  const [marcas, setMarcas] = useState<FipeItem[]>([]);
  const [anos, setAnos] = useState<FipeItem[]>([]);
  const [modelos, setModelos] = useState<FipeItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // Cada escolha nova invalida a resposta que ainda estiver a caminho.
  const rodada = useRef(0);

  useEffect(() => {
    let ativo = true;

    async function carregarInicial() {
      try {
        const listaMarcas = await fipeService.marcas();
        if (!ativo) return;
        setMarcas(listaMarcas);

        if (inicial.marcaId) {
          const listaAnos = await fipeService.anosDaMarca(inicial.marcaId);
          if (!ativo) return;
          setAnos(listaAnos);

          if (inicial.ano) {
            const listaModelos = await fipeService.modelosDoAno(
              inicial.marcaId,
              inicial.ano,
            );
            if (!ativo) return;
            setModelos(listaModelos);
          }
        }
      } catch (error) {
        if (ativo) setErro(mensagemErro(error));
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarInicial();

    return () => {
      ativo = false;
    };
  }, [inicial]);

  async function escolherMarca(marcaId: string) {
    const minha = ++rodada.current;
    setAnos([]);
    setModelos([]);
    setErro("");
    onChange(
      { marcaId, modeloId: "", ano: "" },
      { marca: marcas.find((item) => item.codigo === marcaId)?.nome },
    );

    if (!marcaId) return;

    try {
      setCarregando(true);
      const lista = await fipeService.anosDaMarca(marcaId);
      if (minha === rodada.current) setAnos(lista);
    } catch (error) {
      if (minha === rodada.current) setErro(mensagemErro(error));
    } finally {
      if (minha === rodada.current) setCarregando(false);
    }
  }

  async function escolherAno(codigo: string) {
    const minha = ++rodada.current;
    setModelos([]);
    setErro("");
    onChange(
      { ...valor, ano: codigo, modeloId: "" },
      { ano: codigo ? (anoDoCodigoFipe(codigo) ?? undefined) : undefined },
    );

    if (!codigo) return;

    try {
      setCarregando(true);
      const lista = await fipeService.modelosDoAno(valor.marcaId, codigo);
      if (minha === rodada.current) setModelos(lista);
    } catch (error) {
      if (minha === rodada.current) setErro(mensagemErro(error));
    } finally {
      if (minha === rodada.current) setCarregando(false);
    }
  }

  function escolherModelo(modeloId: string) {
    onChange(
      { ...valor, modeloId },
      { modelo: modelos.find((item) => item.codigo === modeloId)?.nome },
    );
  }

  const anosDisponiveis = anos.filter(
    (item) => anoDoCodigoFipe(item.codigo) !== null,
  );

  return (
    <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
      <div>
        <p className="text-xs font-semibold text-gray-800">Tabela FIPE</p>
        <p className="mt-0.5 text-[11px] text-gray-500">
          Opcional. Escolha marca, ano e modelo (nessa ordem, o ano filtra os
          modelos) para preencher os campos e consultar o valor de mercado.
        </p>
      </div>

      <select
        value={valor.marcaId}
        onChange={(event) => void escolherMarca(event.target.value)}
        disabled={carregando && marcas.length === 0}
        className={classeSelect}
        aria-label="Marca FIPE"
      >
        <option value="">
          {carregando && marcas.length === 0
            ? "Carregando marcas..."
            : "Selecione a marca"}
        </option>
        {marcas.map((item) => (
          <option key={item.codigo} value={item.codigo}>
            {item.nome}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={valor.ano}
          onChange={(event) => void escolherAno(event.target.value)}
          disabled={!valor.marcaId || anosDisponiveis.length === 0}
          className={classeSelect}
          aria-label="Ano FIPE"
        >
          <option value="">
            {valor.marcaId && anos.length === 0 && carregando
              ? "Carregando anos..."
              : "Selecione o ano"}
          </option>
          {anosDisponiveis.map((item) => (
            <option key={item.codigo} value={item.codigo}>
              {item.nome}
            </option>
          ))}
        </select>

        <select
          value={valor.modeloId}
          onChange={(event) => escolherModelo(event.target.value)}
          disabled={!valor.ano || modelos.length === 0}
          className={`${classeSelect} sm:col-span-2`}
          aria-label="Modelo FIPE"
        >
          <option value="">
            {!valor.ano
              ? "Escolha o ano antes"
              : modelos.length === 0 && carregando
                ? "Carregando modelos..."
                : "Selecione o modelo"}
          </option>
          {modelos.map((item) => (
            <option key={item.codigo} value={item.codigo}>
              {item.nome}
            </option>
          ))}
        </select>
      </div>

      {erro && <p className="text-[11px] text-red-600">{erro}</p>}
    </div>
  );
}
