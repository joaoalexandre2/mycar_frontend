import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrCode } from "lucide-react";
import { Modal } from "../ui/Modal";
import { qrService } from "../../services/frotaDiferenciais";
import { mensagemErro } from "../../services/api";
import type { VeiculoConta } from "../../types/conta";

/** QR Code do veículo: o motorista escaneia e cai na tela do carro. Dá para imprimir e colar no veículo. */
export function QrVeiculoModal({ veiculo, onClose }: { veiculo: VeiculoConta; onClose: () => void }) {
  const [imagem, setImagem] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    qrService
      .gerar(veiculo.id)
      .then(async ({ url: endereco }) => {
        const imagemGerada = await QRCode.toDataURL(endereco, { width: 512, margin: 2 });
        if (!ativo) return;
        setUrl(endereco);
        setImagem(imagemGerada);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [veiculo.id]);

  function imprimir() {
    if (!imagem) return;

    const janela = window.open("", "_blank", "width=600,height=700");
    if (!janela) return;

    janela.document.write(
      `<html><head><title>QR ${veiculo.placa}</title></head><body style="font-family:sans-serif;text-align:center;padding:24px">` +
        `<img src="${imagem}" alt="QR Code" style="width:320px;height:320px"/>` +
        `<p style="font-size:28px;font-weight:bold;margin:12px 0 0">${veiculo.placa}</p>` +
        `<p style="font-size:14px;color:#555">Escaneie para reservar ou fazer o checklist</p>` +
        `</body></html>`,
    );
    janela.document.close();
    janela.focus();
    janela.print();
  }

  return (
    <Modal titulo={`QR Code · ${veiculo.placa}`} icone={<QrCode size={16} />} onClose={onClose} larguraMax="max-w-md">
      <div className="space-y-4 px-6 py-5 text-center">
        {!imagem && !erro && <p className="text-xs text-gray-500">Gerando o QR Code...</p>}
        {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{erro}</p>}

        {imagem && (
          <>
            <img src={imagem} alt={`QR Code do veículo ${veiculo.placa}`} className="mx-auto h-64 w-64" />
            <p className="break-all text-xs text-gray-500">{url}</p>
            <button
              type="button"
              onClick={imprimir}
              className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Imprimir para colar no veículo
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
