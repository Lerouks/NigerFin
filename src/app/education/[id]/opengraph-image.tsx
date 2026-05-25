import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const alt = 'NFI Report · Éducation financière';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function getCategory(slug: string) {
  const service = createServiceClient();
  if (!service) return null;
  const { data } = await service
    .from('education_categories')
    .select('title, description')
    .eq('slug', slug)
    .single();
  return data;
}

export default async function EducationOgImage({
  params,
}: {
  params: { id: string };
}) {
  const category = await getCategory(params.id);
  const title = category?.title || 'Éducation financière';
  const subtitle = category?.description || 'Comprendre la finance pas à pas.';

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
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '9999px', background: '#d4a843' }} />
          <div style={{ color: '#d4a843', fontSize: '22px', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 700 }}>
            ÉDUCATION FINANCIÈRE
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1040px' }}>
          <div style={{ color: '#ffffff', fontSize: '64px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {title.length > 120 ? `${title.slice(0, 117)}…` : title}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '28px', lineHeight: 1.4, maxWidth: '960px' }}>
            {subtitle.length > 160 ? `${subtitle.slice(0, 157)}…` : subtitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.12)',
            paddingTop: '28px',
          }}
        >
          <div style={{ color: '#ffffff', fontSize: '28px', fontWeight: 700 }}>NFI Report</div>
          <div style={{ color: '#6b7280', fontSize: '20px' }}>nfireport.com/education</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
