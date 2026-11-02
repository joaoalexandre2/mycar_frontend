import { useEffect, useState, type FormEvent } from "react";
import { Camera } from "lucide-react";
import { Modal } from "../ui/Modal";
import { patioService } from "../../services/estetica";
import { mensagemErro } from "../../services/api";
import type { AtendimentoDaEstetica } from "../../types/estetica";

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

const NOME_DO_MOMENTO = { checkin: "Check-in (chegada)", checkout: "Checkout (entrega)" } as const;

/** Fotos do carro: as de check-in (como chegou) e as de checkout (como saiu). */
export function FotosModal({ atendimento, onAtualizado, onClose }: { atendimento: AtendimentoDaEstetica; onAtualizado: () => void; onClose: () => void }) {
  const [detalhe, setDetalhe] = useState<AtendimentoDaEstetica | null>(null);
  const [momento, setMomento] = useState<"checkin" | "checkout">("checkin");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;

    patioService
      .detalhe(atendimento.id)
      .then((d) => {
        if (ativo) setDetalhe(d);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [atendimento.id, versao]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!arquivo) {
      setErro("Escolha uma foto.");
      return;
    }

    try {
      setEnviando(true);
      await patioService.enviarFoto(atendimento.id, momento, arquivo);
      setArquivo(null);
      setVersao((v) => v + 1);
      onAtualizado();
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Fotos · ${atendimento.placa}`} icone={<Camera size={16} />} onClose={onClose} larguraMax="max-w-2xl">
      <div className="space-y-5 px-6 py-5">
        {detalhe && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {detalhe.fotos?.map((f) => (
              <figure key={f.id} className="space-y-1">
                <img src={f.url} alt={`${NOME_DO_MOMENTO[f.momento]} de ${atendimento.placa}`} className="aspect-square w-full rounded-lg object-cover" />
                <figcaption className="text-xs text-gray-500">{NOME_DO_MOMENTO[f.momento]}</figcaption>
              </figure>
            ))}
            {detalhe.fotos?.length === 0 && <p className="col-span-full text-xs text-gray-500">Nenhuma foto ainda.</p>}
          </div>
        )}

        <form onSubmit={(e) => void enviar(e)} className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <div>
            <label htmlFor="foto-momento" className="mb-1.5 block text-xs font-medium text-gray-700">Momento</label>
            <select id="foto-momento" value={momento} onChange={(e) => setMomento(e.target.value as "checkin" | "checkout")} className={classeCampo}>
              <option value="checkin">{NOME_DO_MOMENTO.checkin}</option>
              <option value="checkout">{NOME_DO_MOMENTO.checkout}</option>
            </select>
          </div>
          <div>
            <label htmlFor="foto-arquivo" className="mb-1.5 block text-xs font-medium text-gray-700">Foto</label>
            <input id="foto-arquivo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} className="text-xs" />
          </div>
          <button type="submit" disabled={enviando} className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {enviando ? "Enviando..." : "Enviar foto"}
          </button>
        </form>

        {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>}
      </div>
    </Modal>
  );
}
