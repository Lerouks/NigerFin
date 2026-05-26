'use client';

interface ChartTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
  formatValue?: (value: number, name: string) => string;
  formatName?: (name: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatValue = (v) => v.toLocaleString('fr-FR'),
  formatName = (n) => n,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="bg-white border border-black/8 rounded-lg shadow-lg px-3 py-2.5 pointer-events-none"
      style={{ minWidth: 120 }}
    >
      {label && (
        <p className="text-[11px] text-gray-400 mb-1.5 font-medium">{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || '#111' }} />
          <span className="text-[12px] text-gray-500">{formatName(entry.name)}</span>
          <span className="text-[13px] font-semibold text-[#111] ml-auto pl-3">
            {formatValue(entry.value, entry.name)}
          </span>
        </div>
      ))}
    </div>
  );
}
