/** Dias de hoje até a data (negativo = já passou). Ignora a hora do dia. */
export function diasAteData(iso: string, hoje = new Date()): number {
  const alvo = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const inicioDeHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

  return Math.round((alvo.getTime() - inicioDeHoje.getTime()) / 86_400_000);
}
