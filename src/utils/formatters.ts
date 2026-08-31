export function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
  
  export function formatarData(data: string) {
    return new Date(`${data}T00:00:00`).toLocaleDateString(
      "pt-BR",
    );
  }