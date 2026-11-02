/** Um ponto de partida para criar grupo: a pessoa escolhe e ajusta. As chaves batem com o servidor. */
export interface ModeloDeGrupo {
  id: string;
  titulo: string;
  descricao: string;
  permissoes: string[];
  menus: string[];
}

export const MODELOS_DE_GRUPO: ModeloDeGrupo[] = [
  {
    id: "cadastros",
    titulo: "Cadastros da frota",
    descricao: "Cadastra motoristas e centros de custo e convida motoristas para usar o sistema.",
    permissoes: ["motoristas", "centros_custo"],
    menus: ["cadastros"],
  },
  {
    id: "trocar-centro",
    titulo: "Trocar centro das reservas",
    descricao: "Muda o centro de custo de uma reserva e vê o histórico das mudanças.",
    permissoes: ["usos_corrigir"],
    menus: [],
  },
  {
    id: "importar",
    titulo: "Importar planilha",
    descricao: "Importa a planilha de utilização dos veículos.",
    permissoes: ["usos_importar"],
    menus: [],
  },
  {
    id: "ver-veiculos",
    titulo: "Ver veículos da frota",
    descricao: "Vê a lista de veículos da frota.",
    permissoes: [],
    menus: ["veiculos"],
  },
  {
    id: "acessos",
    titulo: "Dar acesso a outras pessoas",
    descricao: "Cria grupos e decide quem entra em cada um.",
    permissoes: ["grupos"],
    menus: ["cadastros"],
  },
];

/** Permissões que mexem em Motoristas e centros: marcar uma delas libera esse menu junto. */
const PERMISSOES_QUE_PEDEM_CADASTROS = ["centros_custo", "motoristas", "grupos"];

/** Os menus que um conjunto de permissões precisa: some "Motoristas e centros" quando for preciso. */
export function menusParaPermissoes(permissoes: string[], menus: string[]): string[] {
  const precisaCadastros = permissoes.some((p) => PERMISSOES_QUE_PEDEM_CADASTROS.includes(p));

  if (!precisaCadastros || menus.includes("cadastros")) return menus;

  return [...menus, "cadastros"];
}
