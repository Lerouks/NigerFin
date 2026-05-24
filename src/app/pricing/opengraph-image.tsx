import { ImageResponse } from 'next/og';
import { formatPrice, PREMIUM_MONTHLY_PRICE } from '@/config/pricing';

export const runtime = 'nodejs';
export const revalidate = 86400;

export const alt = 'NFI Report Premium — Tarifs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function PricingOgImage() {
  const monthly = formatPrice(PREMIUM_MONTHLY_PRICE);
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
            TARIFS PREMIUM
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1040px' }}>
          <div style={{ color: '#ffffff', fontSize: '72px', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Devenir Premium
          </div>
          <div style={{ color: '#9ca3af', fontSize: '32px', lineHeight: 1.4 }}>
            {`À partir de ${monthly}/mois. Articles illimités, newsletters Premium, outils avancés.`}
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
          <div style={{ color: '#6b7280', fontSize: '20px' }}>nfireport.com/pricing</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
