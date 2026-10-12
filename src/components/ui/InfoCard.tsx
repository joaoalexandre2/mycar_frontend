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
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-blue-600">{icon}</span>
      </div>
      <strong className="text-2xl font-bold text-gray-900">{value}</strong>
    </div>
  );
}
