/**
 * Navigateurs intégrés aux applications (Facebook, Instagram, Messenger,
 * TikTok, Snapchat, LinkedIn, WeChat, Line, et toute vue web d'Android).
 *
 * Google refuse la connexion depuis ces vues web (erreur 403
 * « disallowed_useragent ») : un lecteur arrivé par un post Facebook ou
 * Instagram tomberait sur une page d'erreur de Google. On le repère avant
 * d'envoyer vers Google, pour lui dire d'ouvrir la page dans son navigateur.
 */
const MARQUEURS = [
  /FBAN|FBAV|FB_IAB|FBIOS/i, // Facebook et Messenger
  /Instagram/i,
  /Messenger/i,
  /musical_ly|BytedanceWebview|TikTok/i,
  /Snapchat/i,
  /LinkedInApp/i,
  /MicroMessenger/i, // WeChat
  /\bLine\//i,
  /; wv\)/, // vue web d'Android
];

export function estNavigateurIntegre(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return MARQUEURS.some((m) => m.test(userAgent));
}
