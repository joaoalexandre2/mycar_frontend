import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface Estado {
  falhou: boolean;
}

/**
 * Pega a falha ao baixar o pacote de uma tela. Acontece, por exemplo, quando
 * uma versão nova foi publicada e a aba aberta ainda aponta para arquivos que
 * não existem mais: recarregar a página resolve.
 */
export class ErroDeTela extends Component<Props, Estado> {
  state: Estado = { falhou: false };

  static getDerivedStateFromError(): Estado {
    return { falhou: true };
  }

  render() {
    if (!this.state.falhou) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="mx-auto mt-16 max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm"
      >
        <p className="font-semibold text-gray-900">
          Não foi possível abrir esta tela.
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Pode ser uma versão nova do MyCar ou uma falha de conexão.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Recarregar a página
        </button>
      </div>
    );
  }
}
