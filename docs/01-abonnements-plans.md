# LOGIQUE METIER - NFI REPORT

## ABONNEMENTS ET PLANS

### 1. Plans d'abonnement existants

Un seul tier : Premium. Trois cycles de facturation :

| Cycle | Prix | Duree | Economie |
|-------|------|-------|----------|
| Mensuel | 5 000 FCFA | 1 mois | -- |
| Trimestriel | 13 750 FCFA | 3 mois | 1 250 FCFA |
| Annuel | 50 000 FCFA | 12 mois | 10 000 FCFA |

Le plan Premium donne acces a :
- Acces illimite a tous les articles
- Analyses et rapports complets
- Acces a tous les cours d'education financiere
- 2 newsletters exclusives par semaine (briefing lundi + bilan vendredi)
- Alertes en temps reel sur les actualites majeures
- Acces a tous les outils premium

4 methodes de paiement : Nita, Amana (mobile money manuel), Carte bancaire (via Stripe), iPayMoney (mobile money + carte).

### 2. Plan gratuit

Oui, il existe un plan gratuit implicite (tout utilisateur inscrit avec role: 'reader'). Limites :

- Visiteur non connecte : 3 articles (tous types confondus) par mois, tracke via localStorage avec reset au 1er du mois suivant.
- Utilisateur connecte (reader) : articles gratuits illimites + 3 articles premium par mois (configurable via la table paywall_config.free_articles_count).
- Newsletter mensuelle uniquement.
- Outils de base uniquement.

Le compteur premium est stocke dans la table premium_article_tracking et compte cote serveur via /api/user/premium-count.

### 3. Fichier de config pricing

Fichier : src/config/pricing.ts

```typescript
export const CURRENCY = 'FCFA';

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface BillingOption {
  cycle: BillingCycle;
  price: number;
  label: string;
  durationLabel: string;
  durationMonths: number;
  savings?: string;
}

export const BILLING_OPTIONS: BillingOption[] = [
  {
    cycle: 'monthly',
    price: 5_000,
    label: '5 000 FCFA/mois',
    durationLabel: '1 mois',
    durationMonths: 1,
  },
  {
    cycle: 'quarterly',
    price: 13_750,
    label: '13 750 FCFA/3 mois',
    durationLabel: '3 mois',
    durationMonths: 3,
    savings: 'Economisez 1 250 FCFA',
  },
  {
    cycle: 'yearly',
    price: 50_000,
    label: '50 000 FCFA/an',
    durationLabel: '1 an',
    durationMonths: 12,
    savings: 'Economisez 10 000 FCFA',
  },
];

export const PREMIUM_MONTHLY_PRICE = 5_000;

export const PREMIUM_TIER: PremiumTier = {
  id: 'premium',
  name: 'Premium',
  price: PREMIUM_MONTHLY_PRICE,
  label: `A partir de ${PREMIUM_MONTHLY_PRICE.toLocaleString('fr-FR')} ${CURRENCY}/mois`,
  features: [
    'Acces illimite a tous les articles',
    'Analyses et rapports complets',
    'Acces a tous les cours d\'education financiere',
    '2 newsletters exclusives par semaine - briefing du lundi et bilan du vendredi',
    'Alertes en temps reel sur les actualites majeures',
    'Acces a tous les outils premium',
  ],
};

export const FREE_TIER_FEATURES = [
  'Articles gratuits illimites',
  '3 articles premium par mois',
  'Newsletter mensuelle',
  'Outils de base',
];

export type PaymentMethodId = 'nita' | 'amana' | 'card' | 'ipaymoney';

export const PAYMENT_METHODS: Record<PaymentMethodId, PaymentMethod> = {
  nita: {
    id: 'nita',
    name: 'Nita Transfert d\'Argent',
    shortName: 'Nita',
    logo: '/nita-logo.png',
    instructions: 'Effectuez votre transfert via Nita au numero ci-dessous...',
    recipientNumber: '+227 97 76 91 31',
    recipientName: 'NFI REPORT',
  },
  amana: {
    id: 'amana',
    name: 'Amana Transfert d\'Argent',
    shortName: 'Amana',
    logo: '/amana-logo.png',
    instructions: 'Effectuez votre transfert via Amana au numero ci-dessous...',
    recipientNumber: '+227 97 76 91 31',
    recipientName: 'NFI REPORT',
  },
  card: {
    id: 'card',
    name: 'Carte bancaire (Visa, Mastercard)',
    shortName: 'Carte',
    logo: '/card-logos.png',
    instructions: 'Redirige vers Stripe.',
    recipientNumber: '',
    recipientName: '',
  },
  ipaymoney: {
    id: 'ipaymoney',
    name: 'iPayMoney (Mobile Money et Carte)',
    shortName: 'iPayMoney',
    logo: '/ipaymoney-logo.png',
    instructions: 'Redirige vers iPayMoney.',
    recipientNumber: '',
    recipientName: '',
  },
};

export type PaymentStatus = 'pending' | 'verified' | 'rejected';
```
