import { useEffect, useRef, useState } from "react";
import { mensagemErro } from "../services/api";

/**
 * Carrega os dados de uma listagem sempre que `chave` muda (página, busca,
 * filtro) e quando `recarregar()` é chamado (depois de salvar, excluir...).
 *
 * - `carregando` é derivado: fica `true` até a carga da chave atual terminar,
 *   sem chamar setState de forma síncrona dentro do efeito.
 * - `carregar` recebe `ativo()`, que vira `false` quando a chave mudou ou a
 *   tela saiu: a resposta de uma busca antiga não deve sobrescrever a atual.
 * - Se `carregar` lançar um erro (e a busca ainda for a atual), `erro` traz a
 *   mensagem até a próxima carga: a tela mostra a falha em vez de uma lista
 *   que parece vazia.
 *
 * Só o resultado da última carga fica guardado. Assim, um erro antigo não
 * reaparece ao voltar para uma página ou filtro que já falhou antes e que
 * agora está carregando (ou carregou) bem.
 */
export function useCarregarLista(
  chave: string,
  carregar: (ativo: () => boolean) => Promise<void>,
) {
  const [versao, setVersao] = useState(0);
  const [resultado, setResultado] = useState<{
    chave: string;
    erro: string | null;
  } | null>(null);
  const carregarRef = useRef(carregar);

  // Sempre usa a versão mais recente do callback (ele lê a página, a busca...).
  useEffect(() => {
    carregarRef.current = carregar;
  });

  const chaveAtual = `${chave}#${versao}`;

  useEffect(() => {
    let ativo = true;

    void carregarRef.current(() => ativo).then(
      () => {
        if (ativo) {
          setResultado({ chave: chaveAtual, erro: null });
        }
      },
      (error: unknown) => {
        if (ativo) {
          setResultado({ chave: chaveAtual, erro: mensagemErro(error) });
        }
      },
    );

    return () => {
      ativo = false;
    };
  }, [chaveAtual]);

  const concluida = resultado?.chave === chaveAtual;

  return {
    carregando: !concluida,
    erro: concluida ? resultado.erro : null,
    recarregar: () => setVersao((atual) => atual + 1),
  };
}
