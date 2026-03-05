'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface GraphRepartitionProps {
  capital: number;
  interest: number;
}

const COLORS = ['#111111', '#d4d4d4'];

export function GraphRepartition({ capital, interest }: GraphRepartitionProps) {
  const total = capital + interest;
  if (total <= 0) return null;

  const data = [
    { name: 'Capital', value: capital, color: '#111111' },
    { name: 'Intérêts', value: interest, color: '#d4d4d4' },
  ];

  const capitalPercent = ((capital / total) * 100).toFixed(1);
  const interestPercent = ((interest / total) * 100).toFixed(1);

  return (
    <div className="bg-white border border-black/[0.06] rounded-xl p-6">
      <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
        Répartition du coût
      </h3>
      <div className="flex items-center gap-6">
        <div className="w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                formatter={((value: number) => `${value.toLocaleString('fr-FR')} FCFA`) as never}
                contentStyle={{
                  background: '#111',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                  padding: '8px 12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#111]" />
            <div>
              <p className="text-[13px] text-gray-500">Capital</p>
              <p className="text-[15px] font-semibold">{capitalPercent}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#d4d4d4]" />
            <div>
              <p className="text-[13px] text-gray-500">Intérêts</p>
              <p className="text-[15px] font-semibold">{interestPercent}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
