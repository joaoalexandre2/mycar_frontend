import type { StatusManutencao } from "../../types/manutencao";

export function StatusManutencaoBadge({
  status,
}: {
  status: StatusManutencao;
}) {
  const config = {
    em_dia: {
      label: "Em dia",
      className: "bg-green-100 text-green-700",
    },

    proxima: {
      label: "Próxima",
      className: "bg-yellow-100 text-yellow-700",
    },

    atrasada: {
      label: "Atrasada",
      className: "bg-red-100 text-red-700",
    },
  };

  const item = config[status];

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}
