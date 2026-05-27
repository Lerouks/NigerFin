import { ImageResponse } from 'next/og';
import { getStrategicEnterprises, AGGREGATED_STATS } from '@/lib/strategic-enterprises';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const alt = 'Atlas economique du Niger - NFI Report';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function EnterprisesAtlasOgImage() {
  const enterprises = await getStrategicEnterprises();
  const count = enterprises.length;
  const stat = AGGREGATED_STATS.find((s) => s.label.includes('Emplois')) ?? AGGREGATED_STATS[0];

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
          padding: '72px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '36px', height: '2px', background: '#d4a843' }} />
          <div
            style={{
              color: '#d4a843',
              fontSize: '20px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Atlas economique du Niger
          </div>
        </div>

        {/* Middle: title + lead */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1056px' }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: '92px',
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
            }}
          >
            Les piliers de l&apos;economie nigerienne
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '32px',
              color: '#9ca3af',
              fontSize: '24px',
              fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ color: '#ffffff', fontSize: '48px', fontWeight: 900 }}>{count}</span>
              <span>entreprises strategiques</span>
            </div>
            <span style={{ color: '#4b5563' }}>·</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ color: '#ffffff', fontSize: '48px', fontWeight: 900 }}>{stat?.value ?? '6'}</span>
              <span>{stat?.label.toLowerCase() ?? 'secteurs couverts'}</span>
            </div>
          </div>
        </div>

        {/* Bottom: brand */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.14)',
            paddingTop: '28px',
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '-0.01em',
            }}
          >
            NFI REPORT
          </div>
          <div style={{ color: '#6b7280', fontSize: '18px' }}>
            nfireport.com/entreprises
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
