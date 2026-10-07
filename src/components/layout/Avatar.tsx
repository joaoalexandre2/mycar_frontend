import { iniciais } from "../../utils/iniciais";

/** Foto da pessoa, ou as iniciais dela quando ainda não tem foto. */
export function Avatar({
  nome,
  foto,
  className = "h-9 w-9",
}: {
  nome?: string;
  foto?: string | null;
  className?: string;
}) {
  if (foto) {
    return (
      <img
        src={foto}
        alt={nome ? `Foto de ${nome}` : "Foto de perfil"}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600`}
    >
      {iniciais(nome)}
    </div>
  );
}
