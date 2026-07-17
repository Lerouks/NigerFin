import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const revalidate = 86400;

export const alt = 'Niger : données économiques et géographiques';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function NigerOgImage() {
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
            NIGER
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1040px' }}>
          <div style={{ color: '#ffffff', fontSize: '72px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Économie du Niger
          </div>
          <div style={{ color: '#9ca3af', fontSize: '30px', lineHeight: 1.4 }}>
            Indicateurs macro, ressources, régions et partenaires. Mises à jour
            issues de l&apos;INS Niger et de la Banque Mondiale.
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
          <div style={{ color: '#6b7280', fontSize: '20px' }}>nfireport.com/niger</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
