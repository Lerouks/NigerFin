'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { PREMIUM_MONTHLY_PRICE, CURRENCY } from '@/config/pricing';
import styles from '@/app/articles/[slug]/article.module.css';

/**
 * L'offre Premium sous le début d'un article réservé aux abonnés (direction
 * « La colonne », 26/11/2026) : un encadré gris, le slogan, le message, le
 * bouton d'abonnement et la connexion en vrai bouton. Les textes sont ceux
 * de l'ancienne offre, mot pour mot.
 */
export function PremiumPaywall() {
  const { isSignedIn } = useAuth();
  const prix = `${PREMIUM_MONTHLY_PRICE.toLocaleString('fr-FR')}\u00a0${CURRENCY}`;

  return (
    <section className={styles.paywall} aria-label="Article réservé aux abonnés" data-sans-reglage="">
      <p className={styles.paywallSlogan}>La connaissance, votre meilleur capital</p>
      <p className={styles.paywallTexte}>
        {isSignedIn
          ? 'Passez en Premium pour accéder à l’intégralité de nos analyses et contenus exclusifs.'
          : 'Connectez-vous ou abonnez-vous pour lire cet article en intégralité.'}
      </p>
      <div className={styles.paywallActions}>
        <Link href="/pricing" className={`${styles.bouton} ${styles.plein}`}>
          {`S’abonner\u00a0: à partir de ${prix}/mois`}
        </Link>
        {isSignedIn ? (
          <Link href="/compte" className={`${styles.bouton} ${styles.paywallConnexion}`}>
            Gérer mon abonnement
          </Link>
        ) : (
          <Link href="/connexion" className={`${styles.bouton} ${styles.paywallConnexion}`}>
            {'Déjà abonné\u00a0? Se connecter'}
          </Link>
        )}
      </div>
      <p className={styles.paywallPlus}>
        <span className={styles.avantage}>Analyses complètes</span>
        <span className={styles.avantage}>Simulateurs Premium</span>
        <span className={styles.avantage}>Newsletters exclusives</span>
      </p>
    </section>
  );
}
