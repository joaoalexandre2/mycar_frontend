import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  description: ReactNode;
  icon: ReactNode;
}

export function StatCard({
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between text-gray-500">
        <span className="text-xs">{title}</span>

        <span className="text-blue-600">
          {icon}
        </span>
      </div>

      <strong className="block text-[28px] leading-none font-bold text-gray-900">
        {value}
      </strong>

      <p className="mt-2 text-[11px] text-gray-400">
        {description}
      </p>
    </div>
  );
}