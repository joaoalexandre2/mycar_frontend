import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { paraPixelsDaImagem, type Retangulo } from "../../utils/ocrHodometro";

/** Seleção em pixels da foto exibida na tela (não da foto original). */
type Selecao = { x: number; y: number; largura: number; altura: number };

/** Os dois cantos do arrasto viram um retângulo, sempre com largura e altura positivas. */
function retanguloEntre(a: { x: number; y: number }, b: { x: number; y: number }): Selecao {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    largura: Math.abs(b.x - a.x),
    altura: Math.abs(b.y - a.y),
  };
}

/**
 * Mostra a foto do painel e deixa o motorista arrastar um retângulo sobre o
 * contador de km. Só essa parte é lida, então o velocímetro fica de fora.
 */
export function RecorteDoVisor({ foto, onLer, onDigitar }: { foto: Blob; onLer: (area: Retangulo) => void; onDigitar: () => void }) {
  const url = useMemo(() => URL.createObjectURL(foto), [foto]);
  const imagem = useRef<HTMLImageElement>(null);
  const [selecao, setSelecao] = useState<Selecao | null>(null);
  const [inicio, setInicio] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  // Ponto do ponteiro dentro da foto exibida, sem sair dos limites dela.
  function pontoNaFoto(evento: PointerEvent<HTMLDivElement>): { x: number; y: number } | null {
    const caixa = imagem.current?.getBoundingClientRect();

    if (!caixa) return null;

    return {
      x: Math.max(0, Math.min(caixa.width, evento.clientX - caixa.left)),
      y: Math.max(0, Math.min(caixa.height, evento.clientY - caixa.top)),
    };
  }

  function comecar(evento: PointerEvent<HTMLDivElement>) {
    const ponto = pontoNaFoto(evento);

    if (!ponto) return;

    evento.currentTarget.setPointerCapture?.(evento.pointerId);
    setInicio(ponto);
    setSelecao({ x: ponto.x, y: ponto.y, largura: 0, altura: 0 });
  }

  function arrastar(evento: PointerEvent<HTMLDivElement>) {
    if (!inicio) return;

    const ponto = pontoNaFoto(evento);

    if (ponto) setSelecao(retanguloEntre(inicio, ponto));
  }

  function soltar() {
    setInicio(null);
  }

  function ler() {
    const caixa = imagem.current;

    if (!caixa || !selecao) return;

    onLer(
      paraPixelsDaImagem(
        selecao,
        { largura: caixa.getBoundingClientRect().width, altura: caixa.getBoundingClientRect().height },
        { largura: caixa.naturalWidth, altura: caixa.naturalHeight },
      ),
    );
  }

  const temArea = selecao !== null && selecao.largura > 4 && selecao.altura > 4;

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-700">Arraste um retângulo sobre o número do hodômetro (o contador de km, não o velocímetro).</p>

      <div className="relative touch-none select-none" onPointerDown={comecar} onPointerMove={arrastar} onPointerUp={soltar} onPointerCancel={soltar}>
        <img ref={imagem} src={url} alt="Foto do painel para marcar o hodômetro" draggable={false} className="block w-full rounded-lg" />

        {selecao && (
          <div
            data-testid="area-do-visor"
            className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/20"
            style={{ left: selecao.x, top: selecao.y, width: selecao.largura, height: selecao.altura }}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={ler}
          disabled={!temArea}
          className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          Ler o km do visor
        </button>
        <button type="button" onClick={onDigitar} className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50">
          Digitar o km
        </button>
      </div>
    </div>
  );
}
