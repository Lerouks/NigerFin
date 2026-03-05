import { NextResponse } from 'next/server';
import { getSiteSettings, getBreakingNews } from '@/lib/sanity';
import { navigationSections } from '@/data/mock-data';

export const revalidate = 300; // 5 minutes

const defaultSocialLinks = {
  facebook: 'https://www.facebook.com/share/1APpbXcsAV/?mibextid=wwXIfr',
  twitter: '',
  linkedin: '',
  instagram: 'https://www.instagram.com/nfireport?igsh=Y3FmYTYyZXBrd3ph&utm_source=qr',
  youtube: 'https://youtube.com/@nfireport?si=bnYKo7AVK9F9pklE',
  tiktok: 'https://www.tiktok.com/@nfireport?_r=1&_t=ZN-94QaNLIYjkE',
};

export async function GET() {
  const [settings, breakingNews] = await Promise.all([
    getSiteSettings(),
    getBreakingNews(),
  ]);

  const fallbackNavigation = navigationSections.map((s) => ({
    label: s.label,
    path: s.path,
    order: s.order,
  }));

  const fallbackBreakingNews = [
    { _id: 'f1', tag: 'MARCHÉS', text: "EUR/XOF stable à 655,957 — Le franc CFA maintient sa parité fixe avec l'euro" },
    { _id: 'f2', tag: 'BRVM', text: "L'indice composite gagne 1,01% en clôture — Hausse portée par les valeurs bancaires" },
    { _id: 'f3', tag: 'NIGER', text: 'Le secteur minier enregistre une croissance de 18% au T1 2026' },
    { _id: 'f4', tag: 'MATIÈRES', text: 'Uranium : les cours mondiaux atteignent 89,50 USD/lb, +1,42% cette semaine' },
    { _id: 'f5', tag: 'UEMOA', text: "Les échanges commerciaux intra-régionaux en hausse de 23% sur l'année" },
  ];

  return NextResponse.json({
    siteName: settings?.siteName || 'NFI Report',
    siteDescription: settings?.siteDescription || 'Niger Financial Insights',
    contactEmail: settings?.contactEmail || 'contact@nfireport.com',
    socialLinks: settings?.socialLinks || defaultSocialLinks,
    navigation: settings?.navigation?.length ? settings.navigation : fallbackNavigation,
    breakingNews: breakingNews.length > 0 ? breakingNews : fallbackBreakingNews,
  });
}
