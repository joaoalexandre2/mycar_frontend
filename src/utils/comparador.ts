import type { VeiculoConta } from "../types/conta";

/** Peças com atalho: o texto vira a busca, junto do veículo (exceto pneu, que usa a medida). */
export const PECAS_COMPARADOR = [
  { chave: "pneu", rotulo: "Pneu (medida do carro)", texto: "pneu" },
  { chave: "pastilha", rotulo: "Pastilha de freio", texto: "pastilha de freio dianteira" },
  { chave: "amortecedor", rotulo: "Amortecedor", texto: "amortecedor dianteiro" },
  { chave: "filtro-oleo", rotulo: "Filtro de óleo", texto: "filtro de óleo" },
  { chave: "bateria", rotulo: "Bateria", texto: "bateria 60ah" },
  { chave: "palheta", rotulo: "Palhetas", texto: "palheta limpador para-brisa" },
  { chave: "vela", rotulo: "Velas de ignição", texto: "vela de ignição jogo" },
] as const;

export type ChavePeca = (typeof PECAS_COMPARADOR)[number]["chave"];

/** "185/65 R15", "185/65R15", "185 65 15" -> "185/65 R15". Vazio se não parecer uma medida. */
export function normalizarMedidaPneu(texto: string | null | undefined): string {
  const m = String(texto ?? "")
    .toUpperCase()
    .match(/(\d{3})\s*[/ ]\s*(\d{2})\s*(?:R|ZR|-)?\s*(\d{2})/);

  return m ? `${m[1]}/${m[2]} R${m[3]}` : "";
}

/** Nome curto do veículo para a busca: marca + 2 primeiras palavras do modelo + ano. */
export function nomeParaBusca(veiculo: Pick<VeiculoConta, "marca" | "modelo" | "ano">) {
  const marca = veiculo.marca.split(" - ").pop() ?? veiculo.marca;
  const modelo = veiculo.modelo.split(" ").slice(0, 2).join(" ");

  return `${marca} ${modelo} ${veiculo.ano}`.replace(/\s+/g, " ").trim();
}

export function montarConsulta(opcoes: {
  texto: string;
  veiculo?: Pick<VeiculoConta, "marca" | "modelo" | "ano"> | null;
  medidaPneu?: string;
}): string {
  if (opcoes.medidaPneu) {
    return `pneu ${opcoes.medidaPneu}`;
  }

  const base = opcoes.texto.trim();

  return opcoes.veiculo ? `${base} ${nomeParaBusca(opcoes.veiculo)}` : base;
}

/** Busca pronta em outras lojas (só links; o preço vem do comparador). */
export function linksOutrasLojas(consulta: string) {
  const q = encodeURIComponent(consulta);

  return [
    { loja: "Google Shopping", url: `https://www.google.com/search?tbm=shop&q=${q}` },
    { loja: "Zoom", url: `https://www.zoom.com.br/search?q=${q}` },
    { loja: "Buscapé", url: `https://www.buscape.com.br/search?q=${q}` },
  ];
}
