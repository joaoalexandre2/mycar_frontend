import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, ImagePlus, Trash2, X } from "lucide-react";
import { fotosVeiculoService, type AlbumDoVeiculo, type FotoVeiculo } from "../../services/fotos";
import { mensagemErro } from "../../services/api";
import { redimensionar } from "../../utils/imagem";
import { formatarData } from "../../utils/formatters";
import type { VeiculoConta } from "../../types/conta";

/** Álbum de fotos do veículo: adicionar (câmera ou galeria), ver em tela cheia e remover. */
export function FotosModal({
  veiculo,
  onClose,
}: {
  veiculo: VeiculoConta;
  onClose: () => void;
}) {
  const [album, setAlbum] = useState<AlbumDoVeiculo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null);
  const [aberta, setAberta] = useState<FotoVeiculo | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ativo = true;

    fotosVeiculoService
      .listar(veiculo.id)
      .then((dados) => {
        if (ativo) setAlbum(dados);
      })
      .catch((error) => {
        if (ativo) setErro(mensagemErro(error));
      });

    return () => {
      ativo = false;
    };
  }, [veiculo.id]);

  async function adicionar(evento: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? []);
    evento.target.value = "";

    if (arquivos.length === 0) return;

    const imagens = arquivos.filter((a) => a.type.startsWith("image/"));

    if (imagens.length === 0) {
      setErro("Escolha arquivos de imagem.");
      return;
    }

    setErro(null);
    let enviadas = 0;
    let ultimoErro: string | null = null;

    for (const [indice, arquivo] of imagens.entries()) {
      setProgresso({ atual: indice + 1, total: imagens.length });

      try {
        const [foto, miniatura] = await Promise.all([
          redimensionar(arquivo, 1600, 0.82),
          redimensionar(arquivo, 400, 0.75),
        ]);
        setAlbum(await fotosVeiculoService.enviar(veiculo.id, foto, miniatura));
        enviadas++;
      } catch (error) {
        ultimoErro = mensagemErro(error);
        // Limite de fotos ou erro de rede: não adianta insistir nas próximas.
        break;
      }
    }

    setProgresso(null);

    if (ultimoErro) {
      setErro(
        enviadas > 0
          ? `${enviadas} foto(s) enviada(s). Depois disso: ${ultimoErro}`
          : ultimoErro,
      );
    }
  }

  async function remover(foto: FotoVeiculo) {
    if (!window.confirm("Remover esta foto do álbum?")) return;

    try {
      setAlbum(await fotosVeiculoService.remover(veiculo.id, foto.id));
      setAberta(null);
    } catch (error) {
      setErro(mensagemErro(error));
    }
  }

  const nome = veiculo.apelido?.trim() || `${veiculo.marca} ${veiculo.modelo}`;
  const cheio = album !== null && album.fotos.length >= album.limite;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Camera size={16} className="text-blue-600" />
              Álbum de fotos
            </h3>
            <p className="mt-1 text-[11px] text-gray-400">
              {nome} · {veiculo.placa}
              {album && ` · ${album.fotos.length} de ${album.limite} fotos`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Fechar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={entrada}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void adicionar(e)}
            />
            <button
              type="button"
              disabled={progresso !== null || cheio}
              onClick={() => entrada.current?.click()}
              className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              <ImagePlus size={16} />
              {progresso
                ? `Enviando ${progresso.atual} de ${progresso.total}...`
                : "Adicionar fotos"}
            </button>
            <p className="text-[11px] text-gray-400">
              No celular, você pode tirar a foto na hora ou escolher da galeria.
              As fotos são reduzidas antes de subir e ficam só na sua conta.
            </p>
          </div>

          {erro && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {erro}
            </p>
          )}

          {!album ? (
            !erro && <p className="text-xs text-gray-400">Carregando...</p>
          ) : album.fotos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center">
              <Camera size={28} className="mx-auto text-gray-300" />
              <p className="mt-3 text-xs text-gray-500">
                Nenhuma foto ainda. Registre o estado do carro, avarias ou
                reformas para ter o histórico.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {album.fotos.map((foto) => (
                <li key={foto.id}>
                  <button
                    type="button"
                    onClick={() => setAberta(foto)}
                    className="group block w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <img
                      src={foto.urlMiniatura}
                      alt={foto.legenda ?? `Foto de ${formatarData(foto.criadaEm)}`}
                      loading="lazy"
                      className="aspect-square w-full object-cover transition group-hover:scale-105"
                    />
                  </button>
                  <p className="mt-1 truncate text-[10px] text-gray-400">
                    {foto.legenda ?? formatarData(foto.criadaEm)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {aberta && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-black/90 p-4"
          onClick={() => setAberta(null)}
        >
          <div className="flex items-center justify-between text-white">
            <span className="text-xs">
              {aberta.legenda ?? formatarData(aberta.criadaEm)}
            </span>
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => void remover(aberta)}
                className="flex h-9 items-center gap-2 rounded-lg bg-white/10 px-3 text-xs font-semibold hover:bg-red-600"
              >
                <Trash2 size={15} />
                Remover
              </button>
              <button
                type="button"
                onClick={() => setAberta(null)}
                title="Fechar"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center pt-3">
            <img
              src={aberta.url}
              alt={aberta.legenda ?? "Foto do veículo"}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
