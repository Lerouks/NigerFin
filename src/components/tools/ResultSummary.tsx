'use client';

interface ResultItem {
  label: string;
  value: string;
  highlight?: boolean;
}

interface ResultSummaryProps {
  title?: string;
  items: ResultItem[];
}

export function ResultSummary({ title = 'Résumé', items }: ResultSummaryProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white border border-black/6 rounded-xl p-6">
      <h2 className="text-[11px] tracking-[0.15em] uppercase text-gray-600 mb-4">
        {title}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center justify-between py-3 px-4 rounded-lg ${
              item.highlight ? 'bg-[#111] text-white' : 'bg-background'
            }`}
          >
            <span className={`text-[13px] ${item.highlight ? 'text-white/60' : 'text-gray-500'}`}>
              {item.label}
            </span>
            <span className={`text-[15px] font-semibold ${item.highlight ? 'text-white' : ''}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
