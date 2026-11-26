import { ImageResponse } from 'next/og';
import { visuelPartage } from '@/components/apprendre/image-partage';
import { getCoursParSlug } from '@/lib/apprendre/donnees';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const alt = 'Un cours de NFI REPORT';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ImageCours({ params }: { params: Promise<{ cours: string }> }) {
  const { cours: slug } = await params;
  const cours = await getCoursParSlug(slug);
  const titre = cours?.titre ?? 'Apprendre';
  const n = cours?.lecons.length ?? 0;
  const ligne = cours ? `${n} leçon${n > 1 ? 's' : ''} · ${cours.minutes} min` : 'Des cours d’économie et de finance';
  return new ImageResponse(visuelPartage({ titre, ligne }), { ...size });
}
