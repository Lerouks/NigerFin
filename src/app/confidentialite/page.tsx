import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';

export const revalidate = 86400;

export const metadata: Metadata = { title: 'Politique de Confidentialité', description: 'Politique de confidentialité de NFI Report : collecte, utilisation et protection de vos données personnelles.' };

export default function ConfidentialitePage() {
  return (
    <DynamicLegalPage
      slug="confidentialite"
      title="Politique de Confidentialité"
      fallbackSections={[
        {
          heading: '1. Responsable du traitement',
          text: "Le responsable du traitement des données personnelles collectées sur le site NFI Report est NFI Report, société de droit nigérien, dont le siège social est situé à Niamey, Niger. Contact : contact@nfireport.com.",
        },
        {
          heading: '2. Données collectées',
          text: "Dans le cadre de l'utilisation du Site et de ses services, NFI Report est susceptible de collecter les données suivantes : données d'identification (nom, prénom, adresse email) lors de la création de compte ; données de connexion (adresse IP, logs de connexion) ; données de navigation anonymisées via des outils d'analyse (PostHog) ; données de paiement (traitées exclusivement par Stripe, NFI Report ne stocke aucune donnée bancaire) ; préférences de lecture et centres d'intérêt pour la personnalisation du contenu.",
        },
        {
          heading: '3. Finalités du traitement',
          text: "Les données collectées sont traitées pour les finalités suivantes : gestion des comptes utilisateurs et des abonnements ; envoi de la newsletter et des communications éditoriales (via Beehiiv et Resend) ; personnalisation de l'expérience utilisateur ; amélioration des services et analyse d'audience ; gestion des paiements et de la facturation ; respect des obligations légales et réglementaires ; prévention des fraudes et sécurité du Site.",
        },
        {
          heading: '4. Base juridique du traitement',
          text: "Conformément à la loi nigérienne n° 2017-28 du 3 mai 2017 relative à la protection des données à caractère personnel et aux textes de la CEDEAO en la matière, les traitements de données sont fondés sur : le consentement de l'utilisateur (inscription newsletter, création de compte) ; l'exécution d'un contrat (gestion de l'abonnement premium) ; l'intérêt légitime de NFI Report (analyse d'audience, amélioration des services, sécurité) ; le respect d'obligations légales (conservation des données de facturation).",
        },
        {
          heading: '5. Durée de conservation',
          text: "Les données personnelles sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles sont collectées : données de compte : pendant toute la durée de l'inscription, puis 12 mois après la suppression du compte ; données de paiement : conformément aux obligations comptables et fiscales nigériennes (10 ans) ; données de navigation : 13 mois maximum ; données de newsletter : jusqu'au désabonnement de l'utilisateur. À l'expiration de ces délais, les données sont supprimées ou anonymisées.",
        },
        {
          heading: '6. Destinataires des données',
          text: "Les données personnelles peuvent être transmises aux prestataires techniques suivants, dans le strict cadre des finalités décrites : Supabase (hébergement et base de données) ; Vercel (hébergement du Site) ; Stripe (traitement des paiements) ; Beehiiv (gestion de la newsletter) ; Resend (envoi d'emails transactionnels) ; PostHog (analyse d'audience) ; Sentry (suivi des erreurs techniques). Ces prestataires s'engagent à traiter les données conformément à leurs propres politiques de confidentialité et aux standards de sécurité applicables. NFI Report ne vend, ne loue et ne cède jamais vos données personnelles à des tiers à des fins commerciales.",
        },
        {
          heading: '7. Transferts de données hors du Niger',
          text: "Certains de nos prestataires techniques étant situés en dehors du Niger et de l'espace CEDEAO (notamment aux États-Unis), des transferts de données peuvent avoir lieu. Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types, certifications de sécurité) afin d'assurer un niveau de protection adéquat conformément à la loi n° 2017-28.",
        },
        {
          heading: '8. Cookies et technologies de suivi',
          text: "Le Site utilise des cookies strictement nécessaires au fonctionnement (authentification, préférences de session) et des cookies d'analyse d'audience (PostHog). Les cookies nécessaires ne requièrent pas de consentement. Pour les cookies d'analyse, votre consentement est recueilli lors de votre première visite. Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres de votre navigateur.",
        },
        {
          heading: '9. Sécurité des données',
          text: "NFI Report met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles : chiffrement des communications (HTTPS/TLS) ; authentification sécurisée des comptes ; accès restreint aux données selon le principe du moindre privilège ; surveillance et détection des intrusions ; sauvegardes régulières. En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, NFI Report s'engage à notifier la Haute Autorité de Protection des Données à Caractère Personnel (HAPDP) du Niger et à vous informer dans les meilleurs délais.",
        },
        {
          heading: '10. Vos droits',
          text: "Conformément à la loi n° 2017-28 du 3 mai 2017 relative à la protection des données à caractère personnel, vous disposez des droits suivants : droit d'accès à vos données personnelles ; droit de rectification des données inexactes ou incomplètes ; droit à l'effacement de vos données (dans les limites légales) ; droit d'opposition au traitement de vos données pour des motifs légitimes ; droit à la limitation du traitement ; droit à la portabilité de vos données. Pour exercer ces droits, contactez-nous à : contact@nfireport.com. Nous nous engageons à répondre dans un délai de 30 jours. En cas de réclamation, vous pouvez saisir la Haute Autorité de Protection des Données à Caractère Personnel (HAPDP) du Niger.",
        },
        {
          heading: '11. Mineurs',
          text: "Le Site n'est pas destiné aux personnes de moins de 16 ans. NFI Report ne collecte pas sciemment de données personnelles de mineurs. Si un parent ou tuteur légal constate que son enfant a fourni des données personnelles sans consentement, il est invité à nous contacter pour procéder à leur suppression.",
        },
        {
          heading: '12. Modifications de la politique',
          text: "NFI Report se réserve le droit de modifier la présente politique de confidentialité à tout moment. Les utilisateurs seront informés de toute modification substantielle par une notification sur le Site ou par email. La version en vigueur est celle accessible sur le Site à la date de consultation.",
        },
        {
          heading: '13. Contact',
          text: "Pour toute question relative à la présente politique de confidentialité ou à l'exercice de vos droits, vous pouvez nous contacter à : contact@nfireport.com.",
        },
      ]}
    />
  );
}
