/** Cartão de indicador usado no topo das listagens (total, ativos, etc.). */
export function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="shrink-0 text-blue-600">{icon}</span>
      </div>
      <div className="valor-fluido-pai">
        <strong className="valor-fluido block font-bold text-gray-900 [--valor-max:1.5rem]">
          {value}
        </strong>
      </div>
    </div>
  );
}
