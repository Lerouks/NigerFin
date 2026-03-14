import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'NFI Report - Actualités économiques et financières du Niger';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#111111',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(160, 138, 94, 0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Top gold line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#a08a5e',
            display: 'flex',
          }}
        />

        {/* Bottom gold line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#a08a5e',
            display: 'flex',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
          }}
        >
          {/* Logo mark - geometric triangle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
            }}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 100 100"
              fill="none"
              style={{ display: 'flex' }}
            >
              <path
                d="M50 10 L85 80 L70 80 L50 30 L30 80 L15 80 Z"
                stroke="#a08a5e"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M50 20 L78 75 L68 75 L50 35 L32 75 L22 75 Z"
                stroke="rgba(160, 138, 94, 0.5)"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>

          {/* Site name */}
          <div
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              display: 'flex',
            }}
          >
            NFI Report
          </div>

          {/* Gold separator */}
          <div
            style={{
              width: '80px',
              height: '3px',
              backgroundColor: '#a08a5e',
              borderRadius: '2px',
              display: 'flex',
            }}
          />

          {/* Tagline */}
          <div
            style={{
              fontSize: '24px',
              fontWeight: 400,
              color: '#a08a5e',
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              display: 'flex',
            }}
          >
            Actualités économiques & financières
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '20px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'flex',
            }}
          >
            Niger & Afrique de l&#39;Ouest
          </div>
        </div>

        {/* URL at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            fontSize: '16px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.05em',
            display: 'flex',
          }}
        >
          nfireport.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
