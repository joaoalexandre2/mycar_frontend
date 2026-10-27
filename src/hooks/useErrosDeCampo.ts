import { useState } from "react";

/** Mensagem de erro por campo, indexada pelo `id` do campo. */
export type ErrosDeCampo = Record<string, string>;

/**
 * Erros de validação de um formulário, um por campo. Ao enviar com erro, o foco
 * vai para o primeiro campo inválido (na ordem da tela) e a mensagem fica junto
 * dele; o erro de um campo some quando a pessoa volta a mexer nele.
 */
export function useErrosDeCampo() {
  const [erros, setErros] = useState<ErrosDeCampo>({});

  /** `ordem` lista os ids dos campos como aparecem na tela. */
  function mostrar(novos: ErrosDeCampo, ordem: string[]) {
    setErros(novos);

    const primeiro = ordem.find((id) => novos[id]);

    if (primeiro) {
      document.getElementById(primeiro)?.focus();
    }
  }

  function limpar(id: string) {
    setErros((atuais) => {
      if (!atuais[id]) {
        return atuais;
      }

      const restantes = { ...atuais };
      delete restantes[id];

      return restantes;
    });
  }

  /**
   * Atributos de acessibilidade do campo `id`. `ajuda` é o id de uma dica fixa
   * que o campo já tinha (aparece depois do erro na leitura).
   */
  function atributos(id: string, ajuda?: string) {
    const erro = erros[id];
    const descricao = [erro ? idDoErro(id) : null, ajuda].filter(Boolean).join(" ");

    return {
      "aria-invalid": erro ? (true as const) : undefined,
      "aria-describedby": descricao || undefined,
    };
  }

  return { erros, mostrar, limpar, atributos };
}

/** Id da mensagem de erro do campo `id` (o `aria-describedby` aponta para ele). */
export function idDoErro(id: string) {
  return `${id}-erro`;
}
