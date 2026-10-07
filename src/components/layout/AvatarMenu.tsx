import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, ImageOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth";
import { mensagemErro } from "../../services/api";
import { fotoDePerfil } from "../../utils/imagem";
import { Avatar } from "./Avatar";

/**
 * O ícone da pessoa no cabeçalho: ao clicar, abre as opções de foto. No celular,
 * "Alterar foto" oferece a câmera ou a galeria.
 */
export function AvatarMenu() {
  const { usuario, atualizarUsuario } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const raiz = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!aberto) return;

    function aoClicar(evento: MouseEvent) {
      if (raiz.current && !raiz.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", aoClicar);

    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberto]);

  async function escolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      setErro("Escolha uma imagem.");
      return;
    }

    try {
      setOcupado(true);
      setErro(null);
      atualizarUsuario(await authService.salvarFoto(await fotoDePerfil(arquivo)));
      setAberto(false);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setOcupado(false);
    }
  }

  async function remover() {
    try {
      setOcupado(true);
      setErro(null);
      atualizarUsuario(await authService.removerFoto());
      setAberto(false);
    } catch (error) {
      setErro(mensagemErro(error));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div ref={raiz} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        title="Foto do perfil"
        aria-label="Foto do perfil"
        aria-expanded={aberto}
        className="relative block rounded-full ring-offset-2 transition hover:ring-2 hover:ring-blue-200"
      >
        <Avatar nome={usuario?.name} foto={usuario?.foto} />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-blue-600 text-white">
          <Camera size={9} />
        </span>
      </button>

      {aberto && (
        <div className="absolute right-0 top-12 z-40 w-52 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
          <input
            ref={entrada}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void escolher(e)}
          />

          <button
            type="button"
            disabled={ocupado}
            onClick={() => entrada.current?.click()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
          >
            <Camera size={15} />
            {ocupado ? "Enviando..." : usuario?.foto ? "Trocar foto" : "Adicionar foto"}
          </button>

          {usuario?.foto && (
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void remover()}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              <ImageOff size={15} />
              Remover foto
            </button>
          )}

          {erro && (
            <p role="alert" className="px-3 py-2 text-[11px] text-red-600">
              {erro}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
