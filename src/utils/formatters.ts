export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function dataISO(valor: string | null | undefined) {
  if (!valor) {
    return "";
  }

  return String(valor).slice(0, 10);
}

export function formatarData(data: string | null | undefined) {
  const iso = dataISO(data);

  if (!iso) {
    return "—";
  }

  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export function soDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export function formatarCpf(cpf: string) {
  const digitos = soDigitos(cpf).slice(0, 11);

  if (digitos.length !== 11) {
    return cpf;
  }

  return digitos.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4",
  );
}

export function formatarKm(km: number | null | undefined) {
  if (km === null || km === undefined) {
    return "—";
  }

  return `${km.toLocaleString("pt-BR")} km`;
}

export function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
