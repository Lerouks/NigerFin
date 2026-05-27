/**
 * Helpers SEO partages pour les pages qui injectent du JSON-LD.
 */

/**
 * Echappe les caracteres dangereux dans une serialisation JSON destinee a etre
 * injectee dans un <script type="application/ld+json">.
 *
 * JSON.stringify natif ne transforme PAS "</script>" en sequence safe : un
 * attaquant qui controle un champ peut casser le tag et injecter du HTML/JS.
 * Pattern utilise par Next.js en interne pour ses propres blocs JSON-LD.
 *
 * Identifie par security-reviewer (HIGH-1) le 2026-05-27 sur /entreprises/[slug].
 * Le meme bug existait sur /outil/[slug], corrige en meme temps.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/[̀-ͯ]/g, '\\u2028')
    .replace(/[̀-ͯ]/g, '\\u2029');
}
