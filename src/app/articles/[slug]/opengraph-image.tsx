import { ImageResponse } from 'next/og';
import { getArticleBySlug } from '@/lib/articles';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const alt = 'NFI Report · Article';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ArticleOgImage({
  params,
}: {
  params: { slug: string };
}) {
  const result = await getArticleBySlug(params.slug);

  const title =
    result?.article.title ||
    'NFI Report · Actualités économiques et financières du Niger';
  const category = result?.article.category || 'NFI REPORT';
  const excerpt = result?.article.excerpt || '';

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
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '9999px',
              background: '#d4a843',
            }}
          />
          <div
            style={{
              color: '#d4a843',
              fontSize: '22px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            {String(category).toUpperCase()}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            maxWidth: '1040px',
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontSize: '64px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            {title.length > 120 ? `${title.slice(0, 117)}…` : title}
          </div>
          {excerpt && (
            <div
              style={{
                color: '#9ca3af',
                fontSize: '28px',
                lineHeight: 1.4,
                maxWidth: '960px',
              }}
            >
              {excerpt.length > 140 ? `${excerpt.slice(0, 137)}…` : excerpt}
            </div>
          )}
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
          <div
            style={{
              color: '#ffffff',
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            NFI Report
          </div>
          <div
            style={{
              color: '#6b7280',
              fontSize: '20px',
            }}
          >
            nfireport.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
