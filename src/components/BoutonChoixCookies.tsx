'use client';

import { ouvrirChoixCookies } from '@/lib/consent';

/**
 * Lien du pied de page qui rouvre le bandeau des cookies : le lecteur peut
 * retirer son accord aussi simplement qu'il l'a donné (RGPD, article 7).
 */
export function BoutonChoixCookies({ className }: { className?: string }) {
  return (
    <button type="button" onClick={ouvrirChoixCookies} className={className}>
      Choix des cookies
    </button>
  );
}
