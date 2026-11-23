import { lerValorEmReais } from "../../utils/numero";
import { formatarMoeda } from "../../utils/formatters";
import { classeDoCampo, classeDoRotulo } from "../ui/Campo";

interface Props {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (texto: string) => void;
  /** Erro de validação do último envio; some quando a pessoa volta a digitar. */
  erro: string | null;
}

/**
 * Campo de valor em reais: mostra o erro logo abaixo e, quando o texto é um
 * valor válido, como ele será gravado ("2.500" → R$ 2.500,00), para quem
 * colou de planilha conferir antes de salvar.
 */
export function CampoEmReais({ id, rotulo, valor, onChange, erro }: Props) {
  const lido = lerValorEmReais(valor);
  const idDoErro = `${id}-erro`;
  const idDaPrevia = `${id}-previa`;
  const mostrarPrevia = !erro && lido.estado === "ok";

  return (
    <div>
      <label htmlFor={id} className={classeDoRotulo}>{rotulo}</label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? idDoErro : mostrarPrevia ? idDaPrevia : undefined}
        className={classeDoCampo}
      />
      {erro && <p id={idDoErro} className="mt-1 text-xs font-medium text-(--tom-danger-texto)">{erro}</p>}
      {mostrarPrevia && <p id={idDaPrevia} className="mt-1 text-xs text-gray-500">Será gravado {formatarMoeda(lido.valor)}</p>}
    </div>
  );
}
