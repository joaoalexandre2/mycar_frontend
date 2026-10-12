import { useEffect, useState } from "react";
import { contaService } from "../services/conta";
import { mensagemErro } from "../services/api";
import type { VeiculoConta } from "../types/conta";

interface Estado {
  carregado: boolean;
  /** Quantos veículos a conta tem. */
  total: number;
  /** O primeiro da lista: vira o padrão das telas que pedem um veículo. */
  primeiro: VeiculoConta | null;
  erro: string | null;
}

/**
 * O mínimo que as telas da conta precisam saber dos veículos antes de o
 * usuário escolher um: se há algum, quantos, e qual abrir por padrão. Uma
 * requisição de um item, não a lista inteira.
 */
export function useVeiculosDaConta(): Estado {
  const [estado, setEstado] = useState<Estado>({
    carregado: false,
    total: 0,
    primeiro: null,
    erro: null,
  });

  useEffect(() => {
    let ativo = true;

    contaService
      .listarVeiculos({ pagina: 1, porPagina: 1 })
      .then((pagina) => {
        if (!ativo) return;
        setEstado({
          carregado: true,
          total: pagina.totalRegistros,
          primeiro: pagina.dados[0] ?? null,
          erro: null,
        });
      })
      .catch((error) => {
        if (!ativo) return;
        setEstado({ carregado: true, total: 0, primeiro: null, erro: mensagemErro(error) });
      });

    return () => {
      ativo = false;
    };
  }, []);

  return estado;
}
