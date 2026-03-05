'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const indices = [
  { name: 'PIB Niger (2025)', value: '10 250 Mrd FCFA', change: '+6,2%', positive: true, numValue: 10250 },
  { name: 'Inflation (IPC)', value: '3,8%', change: '+0,4 pts', positive: false, numValue: 3.8 },
  { name: 'Taux directeur BCEAO', value: '3,50%', change: '0,00', positive: true, numValue: 3.5 },
  { name: 'Dette publique / PIB', value: '42,3%', change: '-1,2 pts', positive: true, numValue: 42.3 },
  { name: 'Reserves de change', value: '4,8 mois', change: '+0,3', positive: true, numValue: 4.8 },
  { name: 'Taux de chomage', value: '15,2%', change: '-0,8 pts', positive: true, numValue: 15.2 },
  { name: 'Balance commerciale', value: '-380 Mrd FCFA', change: '+45 Mrd', positive: true, numValue: -380 },
  { name: 'IDE entrants', value: '620 Mrd FCFA', change: '+12%', positive: true, numValue: 620 },
];

const chartData = [
  { name: 'PIB', value: 10250, unit: 'Mrd' },
  { name: 'IDE', value: 620, unit: 'Mrd' },
  { name: 'Balance', value: -380, unit: 'Mrd' },
];

export function IndicesEconomiques() {
  return (
    <div className="space-y-8">
      {/* Chart */}
      <div className="bg-white border border-black/[0.06] rounded-xl p-6">
        <h3 className="text-[11px] tracking-[0.15em] uppercase text-gray-400 mb-4">
          Indicateurs cles (Mrd FCFA)
        </h3>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={{ stroke: '#e5e5e5' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '8px 12px' }}
                formatter={((value: number) => [`${value.toLocaleString('fr-FR')} Mrd FCFA`]) as never}
              />
              <Bar dataKey="value" fill="#111" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Indices grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {indices.map((idx) => (
          <div key={idx.name} className="flex items-center justify-between p-5 bg-white border border-black/[0.06] rounded-xl hover:border-black/[0.12] transition-colors">
            <div>
              <p className="text-[13px] text-gray-500">{idx.name}</p>
              <p className="text-xl font-bold mt-0.5">{idx.value}</p>
            </div>
            <span className={`text-[13px] font-semibold px-2.5 py-1 rounded-full ${
              idx.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}>
              {idx.change}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[12px] text-gray-400">* Donnees indicatives. Sources : BCEAO, INS Niger, FMI.</p>
    </div>
  );
}
