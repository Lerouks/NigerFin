// Serveur seulement : importé par l'en-tête de l'article (composant serveur).
import sharp from 'sharp';
import { unstable_cache } from 'next/cache';

/**
 * Dimensions réelles de la photo d'un article, pour l'afficher entière à son
 * format d'origine sans décalage au chargement. Lues une fois (en-tête de
 * l'image) puis gardées en cache un mois ; null si l'image ne répond pas,
 * la page retombe alors sur un format 16:9 le temps du chargement.
 */
async function lireDimensions(url: string): Promise<{ largeur: number; hauteur: number } | null> {
  try {
    const reponse = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!reponse.ok) return null;
    const donnees = Buffer.from(await reponse.arrayBuffer());
    const meta = await sharp(donnees).metadata();
    if (!meta.width || !meta.height) return null;
    // Une photo prise de côté (EXIF 5 à 8) s'affiche tournée : largeur et hauteur s'échangent.
    const tournee = (meta.orientation ?? 1) >= 5;
    return tournee ? { largeur: meta.height, hauteur: meta.width } : { largeur: meta.width, hauteur: meta.height };
  } catch {
    return null;
  }
}

export const dimensionsImage = unstable_cache(lireDimensions, ['dimensions-image-article-v1'], {
  revalidate: 60 * 60 * 24 * 30,
});
