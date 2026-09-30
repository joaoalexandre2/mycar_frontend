import { useEffect, useState } from "react";
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

export function FipeSeletor({
  valor,
  onChange,
}: {
  valor: FipeSelecao;
  onChange: (selecao: FipeSelecao, nomes: FipeNomes) => void;
}) {
  const [inicial] = useState(valor);
  const [marcas, setMarcas] = useState<FipeItem[]>([]);
  const [modelos, setModelos] = useState<FipeItem[]>([]);
  const [anos, setAnos] = useState<FipeItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarInicial() {
      try {
        const listaMarcas = await fipeService.marcas();
        if (!ativo) return;
        setMarcas(listaMarcas);

        if (inicial.marcaId) {
          const listaModelos = await fipeService.modelos(inicial.marcaId);
          if (!ativo) return;
          setModelos(listaModelos);

          if (inicial.modeloId) {
            const listaAnos = await fipeService.anos(
              inicial.marcaId,
              inicial.modeloId,
            );
            if (!ativo) return;
            setAnos(listaAnos);
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
    setModelos([]);
    setAnos([]);
    setErro("");
    onChange(
      { marcaId, modeloId: "", ano: "" },
      { marca: marcas.find((item) => item.codigo === marcaId)?.nome },
    );

    if (!marcaId) return;

    try {
      setCarregando(true);
      setModelos(await fipeService.modelos(marcaId));
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  async function escolherModelo(modeloId: string) {
    setAnos([]);
    setErro("");
    onChange(
      { ...valor, modeloId, ano: "" },
      { modelo: modelos.find((item) => item.codigo === modeloId)?.nome },
    );

    if (!modeloId) return;

    try {
      setCarregando(true);
      setAnos(await fipeService.anos(valor.marcaId, modeloId));
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  function escolherAno(codigo: string) {
    onChange(
      { ...valor, ano: codigo },
      { ano: codigo ? (anoDoCodigoFipe(codigo) ?? undefined) : undefined },
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
          Opcional. Escolha marca, modelo e ano para preencher os campos e
          consultar o valor de mercado.
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={valor.modeloId}
          onChange={(event) => void escolherModelo(event.target.value)}
          disabled={!valor.marcaId || modelos.length === 0}
          className={classeSelect}
          aria-label="Modelo FIPE"
        >
          <option value="">
            {valor.marcaId && modelos.length === 0 && carregando
              ? "Carregando modelos..."
              : "Selecione o modelo"}
          </option>
          {modelos.map((item) => (
            <option key={item.codigo} value={item.codigo}>
              {item.nome}
            </option>
          ))}
        </select>

        <select
          value={valor.ano}
          onChange={(event) => escolherAno(event.target.value)}
          disabled={!valor.modeloId || anosDisponiveis.length === 0}
          className={classeSelect}
          aria-label="Ano FIPE"
        >
          <option value="">
            {valor.modeloId && anos.length === 0 && carregando
              ? "Carregando anos..."
              : "Selecione o ano"}
          </option>
          {anosDisponiveis.map((item) => (
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
