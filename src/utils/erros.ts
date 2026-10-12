/**
 * Erro cuja mensagem já está pronta para a pessoa ler (em português, sem
 * jargão). `mensagemErro` mostra esse texto em vez do genérico "não foi
 * possível concluir a operação".
 */
export class ErroDeUsuario extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroDeUsuario";
  }
}
