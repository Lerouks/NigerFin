'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DataPoint {
  label: string;
  capitalRestant: number;
  interetsCumules: number;
}

interface GraphEvolutionProps {
  data: DataPoint[];
}

export function GraphEvolution({ data }: GraphEvolutionProps) {
  if (data.length === 0) return null;

  return (
    <div className="bg-white border border-black/[0.06] rounded-xl p-6">
      <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
        Evolution du remboursement
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111111" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#111111" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInterets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e5e5' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
            />
            <Tooltip
              contentStyle={{
                background: '#111',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              formatter={((value: number, name: string) => [
                `${value.toLocaleString('fr-FR')} FCFA`,
                name === 'capitalRestant' ? 'Capital restant' : 'Interets cumules',
              ]) as never}
            />
            <Area
              type="monotone"
              dataKey="capitalRestant"
              stroke="#111111"
              strokeWidth={2}
              fill="url(#colorCapital)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="interetsCumules"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#colorInterets)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#111]" />
          <span className="text-[12px] text-gray-500">Capital restant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500" />
          <span className="text-[12px] text-gray-500">Interets cumules</span>
        </div>
      </div>
    </div>
  );
}
