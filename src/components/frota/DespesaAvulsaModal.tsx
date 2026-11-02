import { useState, type FormEvent } from "react";
import { Receipt } from "lucide-react";
import { Modal } from "../ui/Modal";
import { despesasAvulsasService } from "../../services/financeiro";
import { mensagemErro } from "../../services/api";
import { dataISOLocal } from "../../utils/formatters";
import type { CategoriaDeDespesa, DespesaAvulsa, DespesaAvulsaPayload } from "../../types/financeiro";
import type { Motorista } from "../../types/frota";
import type { VeiculoConta } from "../../types/conta";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";
const rotulo = "mb-1.5 block text-xs font-medium text-gray-700";

interface Props {
  despesa: DespesaAvulsa | null;
  categorias: CategoriaDeDespesa[];
  veiculos: VeiculoConta[];
  motoristas: Motorista[];
  centros: { id: number; nome: string }[];
  onSalva: () => void;
  onClose: () => void;
}

/** Cadastro e edição de uma despesa avulsa (pedágio, estacionamento, lavagem...). */
export function DespesaAvulsaModal({ despesa, categorias, veiculos, motoristas, centros, onSalva, onClose }: Props) {
  const [categoriaId, setCategoriaId] = useState(String(despesa?.categoria?.id ?? ""));
  const [veiculoId, setVeiculoId] = useState(String(despesa?.veiculo?.id ?? ""));
  const [motoristaId, setMotoristaId] = useState(String(despesa?.motorista?.id ?? ""));
  const [centroId, setCentroId] = useState(String(despesa?.centroCusto?.id ?? ""));
  const [data, setData] = useState(despesa?.data ?? dataISOLocal());
  const [valor, setValor] = useState(despesa ? String(despesa.valor).replace(".", ",") : "");
  const [descricao, setDescricao] = useState(despesa?.descricao ?? "");
  const [comprovante, setComprovante] = useState(despesa?.comprovante ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const categoriasAtivas = categorias.filter((c) => c.ativo || c.id === despesa?.categoria?.id);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const valorNumero = Number(valor.replace(/\./g, "").replace(",", "."));

    if (!categoriaId) {
      setErro("Escolha a categoria da despesa.");
      return;
    }

    if (!data) {
      setErro("Informe a data da despesa.");
      return;
    }

    if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }

    const payload: DespesaAvulsaPayload = {
      categoriaId: Number(categoriaId),
      veiculoId: veiculoId ? Number(veiculoId) : null,
      motoristaId: motoristaId ? Number(motoristaId) : null,
      centroCustoId: centroId ? Number(centroId) : null,
      data,
      valor: valorNumero,
      descricao: descricao.trim() || null,
      comprovante: comprovante.trim() || null,
    };

    try {
      setSalvando(true);

      if (despesa) {
        await despesasAvulsasService.atualizar(despesa.id, payload);
      } else {
        await despesasAvulsasService.criar(payload);
      }

      onSalva();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={despesa ? "Editar despesa" : "Nova despesa"}
      icone={<Receipt size={16} />}
      onClose={onClose}
      larguraMax="max-w-lg"
    >
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="despesa-data" className={rotulo}>Data</label>
            <input id="despesa-data" type="date" value={data} onChange={(e) => setData(e.target.value)} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="despesa-valor" className={rotulo}>Valor (R$)</label>
            <input id="despesa-valor" type="text" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} className={classeCampo} />
          </div>
        </div>

        <div>
          <label htmlFor="despesa-categoria" className={rotulo}>Categoria</label>
          <select id="despesa-categoria" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className={classeCampo}>
            <option value="">Escolha...</option>
            {categoriasAtivas.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="despesa-veiculo" className={rotulo}>Veículo (opcional)</label>
            <select id="despesa-veiculo" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)} className={classeCampo}>
              <option value="">Sem veículo</option>
              {veiculos.map((v) => (
                <option key={v.id} value={v.id}>{v.placa} · {v.marca} {v.modelo}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="despesa-motorista" className={rotulo}>Motorista (opcional)</label>
            <select id="despesa-motorista" value={motoristaId} onChange={(e) => setMotoristaId(e.target.value)} className={classeCampo}>
              <option value="">Sem motorista</option>
              {motoristas.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="despesa-centro" className={rotulo}>Centro de custo (opcional)</label>
          <select id="despesa-centro" value={centroId} onChange={(e) => setCentroId(e.target.value)} className={classeCampo}>
            <option value="">Sem centro de custo</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="despesa-descricao" className={rotulo}>Descrição</label>
            <input id="despesa-descricao" type="text" maxLength={160} value={descricao} onChange={(e) => setDescricao(e.target.value)} className={classeCampo} />
          </div>
          <div>
            <label htmlFor="despesa-comprovante" className={rotulo}>Nº do comprovante</label>
            <input id="despesa-comprovante" type="text" maxLength={80} value={comprovante} onChange={(e) => setComprovante(e.target.value)} className={classeCampo} />
          </div>
        </div>

        {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
