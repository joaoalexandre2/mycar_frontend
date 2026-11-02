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

/**
 * Data no formato AAAA-MM-DD, no fuso local. Nunca use toISOString().slice(0, 10) para isso:
 * ele converte para UTC e, à noite no Brasil, mostra o dia seguinte.
 */
export function dataISOLocal(data: Date = new Date()): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export function hojeISO() {
  return dataISOLocal();
}

export function formatarDataHora(valor: string) {
  const data = new Date(valor);

  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
