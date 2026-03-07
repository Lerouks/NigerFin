import { NextResponse } from 'next/server';
import { navigationSections } from '@/data/mock-data';

export const revalidate = 300;

const defaultSocialLinks = {
  facebook: 'https://www.facebook.com/share/1APpbXcsAV/?mibextid=wwXIfr',
  twitter: '',
  linkedin: '',
  instagram: 'https://www.instagram.com/nfireport?igsh=Y3FmYTYyZXBrd3ph&utm_source=qr',
  youtube: 'https://youtube.com/@nfireport?si=bnYKo7AVK9F9pklE',
  tiktok: 'https://www.tiktok.com/@nfireport?_r=1&_t=ZN-94QaNLIYjkE',
};

const breakingNews = [
  { _id: 'f1', tag: 'MARCHES', text: "EUR/XOF stable a 655,957 : le franc CFA maintient sa parite fixe avec l'euro" },
  { _id: 'f2', tag: 'BRVM', text: "L'indice composite gagne 1,01% en cloture, hausse portee par les valeurs bancaires" },
  { _id: 'f3', tag: 'NIGER', text: 'Le secteur minier enregistre une croissance de 18% au T1 2026' },
  { _id: 'f4', tag: 'MATIERES', text: 'Uranium : les cours mondiaux atteignent 89,50 USD/lb, +1,42% cette semaine' },
  { _id: 'f5', tag: 'UEMOA', text: "Les echanges commerciaux intra-regionaux en hausse de 23% sur l'annee" },
];

export async function GET() {
  const navigation = navigationSections.map((s) => ({
    label: s.label,
    path: s.path,
    order: s.order,
  }));

  return NextResponse.json({
    siteName: 'NFI Report',
    siteDescription: 'Niger Financial Insights',
    contactEmail: 'contact@nfireport.com',
    socialLinks: defaultSocialLinks,
    navigation,
    breakingNews,
  });
}
