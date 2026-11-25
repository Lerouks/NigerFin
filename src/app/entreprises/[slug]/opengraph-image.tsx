import { ImageResponse } from 'next/og';
import { createServiceClient } from '@/lib/supabase';
import { SITE_URL } from '@/lib/config';
import { typographieFr } from '@/lib/typographie-fr';
import { CARTE_NIGER } from '@/components/coming-soon/carte-niger';
import { villeSurLaCarte } from '@/components/niger/CarteSiege';
import { villeDuSiege } from '@/data/niger-chiffres';
import { LIGNE_ENTREPRISE, logoSurNoir } from '@/data/entreprises-niger';

export const runtime = 'nodejs';
export const revalidate = 3600;

export const alt = 'Fiche entreprise | NFI REPORT';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Image de partage d'une fiche entreprise (réseaux, messageries), dans la
 * grammaire de la fiche : fond noir, logo sur le noir, nom en grand, ce que
 * fait l'entreprise, et la carte du Niger en points avec le siège allumé.
 */

async function getEnterprise(slug: string) {
  const service = createServiceClient();
  if (!service) return null;
  const { data } = await service
    .from('strategic_enterprises')
    .select('name, full_name, headquarters, logo_url')
    .eq('slug', slug)
    .eq('is_visible', true)
    .single();
  return data;
}

/**
 * Texte de l'image : apostrophes typographiques, mais espaces ordinaires. Les
 * insécables n'y servent à rien (pas de retour à la ligne) et le moteur de
 * l'image les dessine plus étroites qu'une espace : les blancs devenaient
 * irréguliers (« Le crédit  agricole »).
 */
function texteImage(texte: string): string {
  return typographieFr(texte)
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\u2011/g, '-');
}

/** Le logo en data URL : sans lui (réseau en panne), l'image se dessine quand même. */
async function logoEnDataUrl(chemin: string | null): Promise<string | null> {
  if (!chemin) return null;
  try {
    const url = chemin.startsWith('http') ? chemin : new URL(chemin, SITE_URL).toString();
    const reponse = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!reponse.ok) return null;
    const type = reponse.headers.get('content-type') ?? 'image/png';
    if (!type.startsWith('image/')) return null;
    const octets = Buffer.from(await reponse.arrayBuffer());
    return `data:${type};base64,${octets.toString('base64')}`;
  } catch {
    return null;
  }
}

/** La carte en points, siège allumé, en SVG (data URL) pour le moteur de l'image. */
function carteEnDataUrl(ville: string): string | null {
  const siege = villeSurLaCarte(ville);
  if (!siege) return null;
  const { largeur, hauteur, pas, lignes, villes } = CARTE_NIGER;
  const points: string[] = [];
  lignes.forEach((plages, rang) => {
    for (let i = 0; i < plages.length; i += 2) {
      for (let colonne = plages[i]!; colonne <= plages[i + 1]!; colonne += 1) {
        points.push(`<circle cx="${pas / 2 + colonne * pas}" cy="${pas / 2 + rang * pas}" r="2.7"/>`);
      }
    }
  });
  const autres = villes
    .filter((v) => v.nom !== siege.nom)
    .map((v) => `<circle cx="${v.x}" cy="${v.y}" r="5" fill="#9ca3af"/>`)
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${largeur} ${hauteur}">` +
    `<g fill="#8a8e95" opacity="0.5">${points.join('')}</g>${autres}` +
    `<circle cx="${siege.x}" cy="${siege.y}" r="27" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2.5"/>` +
    `<circle cx="${siege.x}" cy="${siege.y}" r="13" fill="#fff" stroke="#0b0b0c" stroke-width="4"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export default async function EnterpriseOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const enterprise = await getEnterprise(slug);
  const nom = enterprise?.name || 'Entreprise';
  const nomComplet = enterprise?.full_name && enterprise.full_name !== nom ? enterprise.full_name : null;
  const ligne = LIGNE_ENTREPRISE[slug] ?? null;
  const ville = villeDuSiege(enterprise?.headquarters);
  const [logo, carte] = await Promise.all([
    enterprise ? logoEnDataUrl(logoSurNoir(slug, enterprise.logo_url)) : Promise.resolve(null),
    Promise.resolve(enterprise ? carteEnDataUrl(ville) : null),
  ]);
  const siege = villeSurLaCarte(ville);
  const { largeur, hauteur } = CARTE_NIGER;
  const largeurCarte = 470;
  const hauteurCarte = Math.round((largeurCarte * hauteur) / largeur);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          background: '#0b0b0c',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logo ? (
              <img src={logo} alt="" height={84} style={{ height: '84px', maxWidth: '300px', objectFit: 'contain', objectPosition: 'left' }} />
            ) : null}
            <div
              style={{
                marginTop: logo ? '40px' : '0px',
                color: '#ffffff',
                fontSize: nom.length > 11 ? '76px' : '96px',
                fontWeight: 800,
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {nom}
            </div>
            {nomComplet ? (
              <div style={{ marginTop: '20px', color: '#8a8e95', fontSize: '28px', lineHeight: 1.3 }}>
                {texteImage(nomComplet)}
              </div>
            ) : null}
            {ligne ? (
              <div style={{ marginTop: '10px', color: '#e5e7eb', fontSize: '32px', lineHeight: 1.3 }}>
                {texteImage(ligne)}
              </div>
            ) : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ color: '#ffffff', fontSize: '28px', fontWeight: 700 }}>NFI REPORT</div>
            <div style={{ color: '#6b7280', fontSize: '20px' }}>nfireport.com</div>
          </div>
        </div>
        {carte && siege ? (
          <div style={{ display: 'flex', position: 'relative', alignSelf: 'center', width: `${largeurCarte}px`, height: `${hauteurCarte}px` }}>
            <img src={carte} alt="" width={largeurCarte} height={hauteurCarte} />
            <div
              style={{
                position: 'absolute',
                // Vers l'est du pays, le nom passe à gauche du repère pour rester dans l'image.
                ...(siege.x > largeur * 0.72
                  ? { right: `${largeurCarte - (siege.x / largeur) * largeurCarte + 20}px` }
                  : { left: `${(siege.x / largeur) * largeurCarte + 20}px` }),
                top: `${(siege.y / hauteur) * hauteurCarte - 13}px`,
                color: '#ffffff',
                fontSize: '22px',
                fontWeight: 700,
              }}
            >
              {siege.nom}
            </div>
          </div>
        ) : null}
      </div>
    ),
    { ...size },
  );
}
