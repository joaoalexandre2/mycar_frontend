import { useEffect, useRef, useState } from "react";

/**
 * Carrega os dados de uma listagem sempre que `chave` muda (página, busca,
 * filtro) e quando `recarregar()` é chamado (depois de salvar, excluir...).
 *
 * - `carregando` é derivado: fica `true` até a carga da chave atual terminar,
 *   sem chamar setState de forma síncrona dentro do efeito.
 * - `carregar` recebe `ativo()`, que vira `false` quando a chave mudou ou a
 *   tela saiu: a resposta de uma busca antiga não deve sobrescrever a atual.
 */
export function useCarregarLista(
  chave: string,
  carregar: (ativo: () => boolean) => Promise<void>,
) {
  const [versao, setVersao] = useState(0);
  const [concluida, setConcluida] = useState<string | null>(null);
  const carregarRef = useRef(carregar);

  // Sempre usa a versão mais recente do callback (ele lê a página, a busca...).
  useEffect(() => {
    carregarRef.current = carregar;
  });

  const chaveAtual = `${chave}#${versao}`;

  useEffect(() => {
    let ativo = true;

    void carregarRef
      .current(() => ativo)
      .finally(() => {
        if (ativo) {
          setConcluida(chaveAtual);
        }
      });

    return () => {
      ativo = false;
    };
  }, [chaveAtual]);

  return {
    carregando: concluida !== chaveAtual,
    recarregar: () => setVersao((atual) => atual + 1),
  };
}
