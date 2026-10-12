/** Mostrado enquanto o pacote de uma tela (perfil) é baixado. */
export function CarregandoTela() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500"
    >
      Carregando...
    </div>
  );
}
