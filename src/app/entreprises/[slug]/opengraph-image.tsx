import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const alt = 'NFI Report - Entreprise strategique';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function getEnterprise(slug: string) {
  const service = createServiceClient();
  if (!service) return null;
  const { data } = await service
    .from('strategic_enterprises')
    .select('name, full_name, sector, headquarters, founded_year, description')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();
  return data;
}

export default async function EnterpriseOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const enterprise = await getEnterprise(slug);
  const title = enterprise?.name || 'Entreprise strategique';
  const sector = enterprise?.sector || 'Atlas economique';
  const subtitle = enterprise?.full_name || enterprise?.description || '';
  const founded = enterprise?.founded_year;
  const hq = enterprise?.headquarters;

  // KPI line under the title: only show items that exist
  const kpis: string[] = [];
  if (founded) kpis.push(`Fondee ${founded}`);
  if (hq) kpis.push(hq);

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
          <div
            style={{
              width: '36px',
              height: '2px',
              background: '#d4a843',
            }}
          />
          <div
            style={{
              color: '#d4a843',
              fontSize: '20px',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            {String(sector).toUpperCase()}
          </div>
        </div>

        {/* Middle: title + subtitle + kpis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1056px' }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: title.length > 18 ? '88px' : '108px',
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
            }}
          >
            {title.length > 60 ? `${title.slice(0, 57)}...` : title}
          </div>
          {subtitle ? (
            <div
              style={{
                color: '#c0c0c0',
                fontSize: '26px',
                lineHeight: 1.35,
                maxWidth: '960px',
                fontStyle: 'italic',
              }}
            >
              {subtitle.length > 140 ? `${subtitle.slice(0, 137)}...` : subtitle}
            </div>
          ) : null}
          {kpis.length > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                color: '#9ca3af',
                fontSize: '20px',
                fontWeight: 500,
              }}
            >
              {kpis.map((kpi, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {i > 0 ? <span style={{ color: '#4b5563' }}>·</span> : null}
                  <span>{kpi}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Bottom: brand + url */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.14)',
            paddingTop: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
            <div
              style={{
                color: '#d4a843',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.22em',
                fontWeight: 700,
              }}
            >
              Atlas economique
            </div>
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
