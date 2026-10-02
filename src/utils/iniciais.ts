export function iniciais(nome?: string) {
  if (!nome) {
    return "?";
  }

  const partes = nome.trim().split(/\s+/);

  return (
    partes
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
