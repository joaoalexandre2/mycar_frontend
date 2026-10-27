import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Camera, Trash2 } from "lucide-react";
import { redimensionar } from "../../utils/imagem";
import { mensagemErro } from "../../services/api";

/** Maior lado da foto do painel, em pixels: dá para ler o número e sobe rápido no celular. */
const LADO_MAXIMO = 1280;

const classeCampo =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none focus:border-blue-500";

/**
 * Km do hodômetro e a foto do painel. A foto vem da câmera (no celular abre
 * direto a traseira) ou da galeria, e é reduzida aqui, no navegador, antes de subir.
 */
export function CapturaHodometro({
  rotulo,
  km,
  onKm,
  foto,
  onFoto,
  dica,
}: {
  /** "Km de saída" ou "Km de chegada". */
  rotulo: string;
  km: string;
  onKm: (valor: string) => void;
  foto: Blob | null;
  onFoto: (foto: Blob | null) => void;
  /** Texto de apoio abaixo do campo (por exemplo, o último km do veículo). */
  dica?: string;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  // A prévia é um link temporário do navegador: libera quando a foto troca ou sai.
  const previa = useMemo(() => (foto ? URL.createObjectURL(foto) : null), [foto]);

  useEffect(() => {
    return () => {
      if (previa) URL.revokeObjectURL(previa);
    };
  }, [previa]);

  async function escolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha uma imagem (foto do painel).");
      return;
    }

    setErro(null);
    setProcessando(true);

    try {
      onFoto(await redimensionar(arquivo, LADO_MAXIMO, 0.8));
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-700">
          {rotulo}
          <input
            type="text"
            inputMode="numeric"
            value={km}
            onChange={(e) => onKm(e.target.value)}
            placeholder="Ex.: 45200"
            className={`${classeCampo} mt-1.5`}
          />
        </label>
        {dica && <p className="mt-1 text-xs text-gray-500">{dica}</p>}
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={entrada}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => void escolher(e)}
          className="hidden"
          aria-label="Foto do hodômetro"
          data-testid="entrada-foto-hodometro"
        />

        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={processando}
          className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <Camera size={14} />
          {processando ? "Preparando foto..." : foto ? "Trocar foto do hodômetro" : "Fotografar o hodômetro"}
        </button>

        {previa && (
          <div className="flex items-center gap-2">
            <img
              src={previa}
              alt="Prévia da foto do hodômetro"
              className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
            />
            <button
              type="button"
              onClick={() => onFoto(null)}
              title="Tirar a foto"
              className="text-gray-400 transition hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {erro && (
        <p role="alert" className="text-xs text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
