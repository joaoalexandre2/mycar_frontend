import { useState, type FormEvent } from "react";
import { Gauge } from "lucide-react";
import { Modal } from "../ui/Modal";
import { usosService } from "../../services/frota";
import { mensagemErro } from "../../services/api";
import { formatarKm } from "../../utils/formatters";
import { lerInteiroBR } from "../../utils/numero";
import type { VeiculoConta } from "../../types/conta";

/**
 * Corrige a quilometragem atual do veículo. O km sobe sozinho a cada saída ou
 * chegada registrada; este é o único jeito de ele diminuir (hodômetro trocado,
 * número digitado errado, primeiro km de um veículo que acabou de entrar na frota).
 */
export function CorrigirKmModal({
  veiculo,
  onSalvo,
  onClose,
}: {
  veiculo: VeiculoConta;
  onSalvo: (kmAtual: number) => void;
  onClose: () => void;
}) {
  const [km, setKm] = useState(veiculo.kmAtual !== null ? String(veiculo.kmAtual) : "");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    const lido = lerInteiroBR(km);

    if (lido.estado !== "ok" || lido.valor < 0) {
      setErro("Informe o km do hodômetro (só números, ex.: 45200).");
      return;
    }

    if (motivo.trim().length < 5) {
      setErro("Explique o motivo da correção (mínimo 5 letras). Ele fica registrado no histórico.");
      return;
    }

    try {
      setSalvando(true);
      const { kmAtual } = await usosService.corrigirKm(veiculo.id, lido.valor, motivo.trim());
      onSalvo(kmAtual);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Km atual do veículo"
      subtitulo={`${veiculo.placa} · hoje: ${formatarKm(veiculo.kmAtual)}`}
      icone={<Gauge size={16} />}
      onClose={onClose}
    >
      <form onSubmit={(e) => void salvar(e)} className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="km-atual" className="mb-1.5 block text-xs font-medium text-gray-700">
            Km no hodômetro
          </label>
          <input
            id="km-atual"
            type="text"
            inputMode="numeric"
            value={km}
            onChange={(e) => setKm(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
            autoFocus
          />
          <p className="mt-1.5 text-[11px] text-gray-500">
            O km sobe sozinho a cada saída ou chegada registrada. Use isto só para corrigir um número errado ou para
            informar o km de um veículo novo.
          </p>
        </div>

        <div>
          <label htmlFor="km-motivo" className="mb-1.5 block text-xs font-medium text-gray-700">
            Motivo da correção
          </label>
          <input
            id="km-motivo"
            type="text"
            maxLength={255}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: hodômetro digitado errado na saída"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500"
          />
          <p className="mt-1.5 text-[11px] text-gray-500">Fica registrado no histórico, com seu nome e a data.</p>
        </div>

        {erro && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={salvando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {salvando ? "Salvando..." : "Salvar km"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
