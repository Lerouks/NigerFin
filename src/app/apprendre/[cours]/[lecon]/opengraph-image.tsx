import { ImageResponse } from 'next/og';
import { visuelPartage } from '@/components/apprendre/image-partage';
import { getLecon } from '@/lib/apprendre/donnees';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const alt = 'Une leçon de NFI REPORT';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ImageLecon({ params }: { params: Promise<{ cours: string; lecon: string }> }) {
  const { cours, lecon } = await params;
  const l = await getLecon(cours, lecon);
  const titre = l?.titre ?? 'Apprendre';
  const ligne = l ? `${l.cours.titre} · leçon ${l.numero} sur ${l.cours.lecons.length}` : 'Des cours d’économie et de finance';
  return new ImageResponse(visuelPartage({ titre, ligne }), { ...size });
}
