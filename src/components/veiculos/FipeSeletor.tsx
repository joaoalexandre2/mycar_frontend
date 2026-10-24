import { useEffect, useMemo, useRef, useState } from "react";
import { anoDoCodigoFipe, fipeService, type FipeItem } from "../../services/fipe";
import { mensagemErro } from "../../services/api";
import { ListaComBusca } from "../ui/ListaComBusca";
import { modeloDaFipe, modelosDistintos, versoesDoModelo } from "../../utils/fipeModelos";

export interface FipeSelecao {
  marcaId: string;
  /** Código da FIPE da versão escolhida (a FIPE guarda modelo e versão juntos). */
  modeloId: string;
  ano: string;
}

export interface FipeNomes {
  marca?: string;
  /** Nome completo da FIPE ("Gol 1.0 Mi Total Flex 8V 4p"). */
  modelo?: string;
  ano?: number;
}

/**
 * Marca → modelo → versão → ano, cada um com busca. A tabela FIPE guarda modelo
 * e versão num texto só; aqui eles são separados para a lista de cada campo
 * ficar curta. O ano vem por último porque cada versão tem os seus anos.
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
  const [itens, setItens] = useState<FipeItem[]>([]);
  const [anos, setAnos] = useState<FipeItem[]>([]);
  const [modelo, setModelo] = useState("");
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
          const listaModelos = await fipeService.modelos(inicial.marcaId);
          if (!ativo) return;
          setItens(listaModelos);

          const salvo = listaModelos.find((item) => item.codigo === inicial.modeloId);
          if (salvo) setModelo(modeloDaFipe(salvo.nome));

          if (salvo) {
            const listaAnos = await fipeService.anos(inicial.marcaId, inicial.modeloId);
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
    const minha = ++rodada.current;
    setItens([]);
    setAnos([]);
    setModelo("");
    setErro("");
    onChange(
      { marcaId, modeloId: "", ano: "" },
      { marca: marcas.find((item) => item.codigo === marcaId)?.nome },
    );

    if (!marcaId) return;

    try {
      setCarregando(true);
      const lista = await fipeService.modelos(marcaId);
      if (minha === rodada.current) setItens(lista);
    } catch (error) {
      if (minha === rodada.current) setErro(mensagemErro(error));
    } finally {
      if (minha === rodada.current) setCarregando(false);
    }
  }

  function escolherModelo(nome: string) {
    ++rodada.current;
    setModelo(nome);
    setAnos([]);
    setErro("");
    onChange({ ...valor, modeloId: "", ano: "" }, {});
  }

  async function escolherVersao(modeloId: string) {
    const minha = ++rodada.current;
    setAnos([]);
    setErro("");
    onChange(
      { ...valor, modeloId, ano: "" },
      { modelo: itens.find((item) => item.codigo === modeloId)?.nome },
    );

    if (!modeloId) return;

    try {
      setCarregando(true);
      const lista = await fipeService.anos(valor.marcaId, modeloId);
      if (minha === rodada.current) setAnos(lista);
    } catch (error) {
      if (minha === rodada.current) setErro(mensagemErro(error));
    } finally {
      if (minha === rodada.current) setCarregando(false);
    }
  }

  function escolherAno(codigo: string) {
    onChange({ ...valor, ano: codigo }, { ano: anoDoCodigoFipe(codigo) ?? undefined });
  }

  const listaDeModelos = useMemo(
    () => modelosDistintos(itens).map((nome) => ({ codigo: nome, nome })),
    [itens],
  );
  const versoes = useMemo(() => versoesDoModelo(itens, modelo), [itens, modelo]);
  const anosDisponiveis = anos.filter((item) => anoDoCodigoFipe(item.codigo) !== null);

  const carregandoMarcas = carregando && marcas.length === 0;

  return (
    <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
      <div>
        <p className="text-xs font-semibold text-gray-800">Tabela FIPE</p>
        <p className="mt-0.5 text-[11px] text-gray-500">
          Opcional. Busque a marca, o modelo, a versão e o ano para preencher os campos e
          consultar o valor de mercado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ListaComBusca
          rotulo="Marca FIPE"
          valor={valor.marcaId}
          opcoes={marcas}
          placeholder={carregandoMarcas ? "Carregando marcas..." : "Busque a marca"}
          desabilitado={carregandoMarcas}
          onChange={(codigo) => void escolherMarca(codigo)}
        />

        <ListaComBusca
          rotulo="Modelo FIPE"
          valor={modelo}
          opcoes={listaDeModelos}
          placeholder={
            !valor.marcaId
              ? "Escolha a marca antes"
              : itens.length === 0 && carregando
                ? "Carregando modelos..."
                : "Busque o modelo"
          }
          desabilitado={!valor.marcaId || listaDeModelos.length === 0}
          onChange={escolherModelo}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <ListaComBusca
            rotulo="Versão FIPE"
            valor={valor.modeloId}
            opcoes={versoes}
            placeholder={!modelo ? "Escolha o modelo antes" : "Busque a versão"}
            desabilitado={!modelo || versoes.length === 0}
            onChange={(codigo) => void escolherVersao(codigo)}
          />
        </div>

        <ListaComBusca
          rotulo="Ano FIPE"
          valor={valor.ano}
          opcoes={anosDisponiveis}
          placeholder={
            !valor.modeloId
              ? "Escolha a versão antes"
              : anos.length === 0 && carregando
                ? "Carregando anos..."
                : "Busque o ano"
          }
          desabilitado={!valor.modeloId || anosDisponiveis.length === 0}
          onChange={escolherAno}
        />
      </div>

      {erro && <p className="text-[11px] text-red-600">{erro}</p>}
    </div>
  );
}
