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
 */
export function useCarregarLista(
  chave: string,
  carregar: (ativo: () => boolean) => Promise<void>,
) {
  const [versao, setVersao] = useState(0);
  const [concluida, setConcluida] = useState<string | null>(null);
  const [falha, setFalha] = useState<{ chave: string; mensagem: string } | null>(
    null,
  );
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
      .catch((error: unknown) => {
        if (ativo) {
          setFalha({ chave: chaveAtual, mensagem: mensagemErro(error) });
        }
      })
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
    erro: falha?.chave === chaveAtual ? falha.mensagem : null,
    recarregar: () => setVersao((atual) => atual + 1),
  };
}
