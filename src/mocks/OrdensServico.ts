import type { OrdemServico } from "../types/ordemServico";

export const ordensServicoMock: OrdemServico[] = [
  {
    id: 1,
    veiculoId: 1,
    descricao: "Motor apresentando falhas durante o funcionamento",
    status: "aberta",
    valor: 350,
    dataAbertura: "2026-08-20",
  },
  {
    id: 2,
    veiculoId: 2,
    descricao: "Revisão preventiva de 40.000 km",
    status: "em_andamento",
    valor: 890,
    dataAbertura: "2026-08-21",
  },
  {
    id: 3,
    veiculoId: 3,
    descricao: "Troca de óleo e filtros",
    status: "concluida",
    valor: 420,
    dataAbertura: "2026-08-18",
  },
  {
    id: 4,
    veiculoId: 4,
    descricao: "Sistema de freios apresentando ruído",
    status: "aberta",
    valor: 680,
    dataAbertura: "2026-08-23",
  },
  {
    id: 5,
    veiculoId: 5,
    descricao: "Alinhamento e balanceamento",
    status: "concluida",
    valor: 220,
    dataAbertura: "2026-08-17",
  },
];