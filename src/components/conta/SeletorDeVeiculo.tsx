import { SelectComBusca } from "../ui/SelectComBusca";
import { contaService } from "../../services/conta";
import { rotuloVeiculoConta } from "../../utils/rotulos";
import type { VeiculoConta } from "../../types/conta";

interface Props {
  /** Id do veículo escolhido, como texto ("" = nenhum). */
  valor: string;
  /** O veículo já escolhido (para mostrar o nome sem buscar de novo). */
  veiculoEscolhido?: VeiculoConta | null;
  aoMudar: (id: string, veiculo: VeiculoConta | null) => void;
  /** Opção fixa que significa "nenhum" (ex.: "Todos os veículos"). */
  opcaoVazia?: string;
  rotulo?: string;
  placeholder?: string;
}

/**
 * Escolha de veículo da conta com busca no servidor: serve para quem tem 3
 * veículos e para uma frota de centenas (sem o teto de 100 de antes).
 */
export function SeletorDeVeiculo({
  valor,
  veiculoEscolhido,
  aoMudar,
  opcaoVazia,
  rotulo = "Veículo",
  placeholder = "Busque por placa, apelido ou modelo",
}: Props) {
  return (
    <SelectComBusca<VeiculoConta>
      valor={valor}
      rotulo={rotulo}
      placeholder={placeholder}
      opcaoVazia={opcaoVazia}
      rotuloInicial={veiculoEscolhido ? rotuloVeiculoConta(veiculoEscolhido) : ""}
      buscar={async (termo) => {
        const pagina = await contaService.listarVeiculos({
          pagina: 1,
          porPagina: 20,
          busca: termo,
        });

        return pagina.dados.map((veiculo) => ({
          id: veiculo.id,
          rotulo: rotuloVeiculoConta(veiculo),
          dado: veiculo,
        }));
      }}
      onChange={(id, opcao) => aoMudar(id, opcao?.dado ?? null)}
    />
  );
}
