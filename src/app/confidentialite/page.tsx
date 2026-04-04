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
          text: "Le responsable du traitement des données personnelles collectées sur le site NFI Report (ci-après «\u00A0le Site\u00A0») est NFI Report, société de droit nigérien, dont le siège social est situé à Niamey (Niger). Pour toute question relative au traitement de vos données, vous pouvez écrire à contact@nfireport.com.",
        },
        {
          heading: '2. Données collectées',
          text: "Dans le cadre de l'utilisation du Site et de ses services, NFI Report est susceptible de collecter les catégories de données suivantes\u00A0: données d'identification (nom, prénom, adresse email) lors de la création d'un compte\u00A0; données de connexion (adresse IP, journaux techniques, identifiants de session)\u00A0; données de navigation anonymisées via des outils d'analyse (PostHog)\u00A0; données de paiement (traitées exclusivement par Stripe, NFI Report ne stocke aucune donnée bancaire sur ses serveurs)\u00A0; préférences de lecture et centres d'intérêt pour la personnalisation éditoriale. NFI Report applique un principe strict de minimisation\u00A0: seules les données strictement nécessaires aux finalités décrites sont collectées.",
        },
        {
          heading: '3. Données sensibles',
          text: "NFI Report ne collecte, ne traite ni ne conserve aucune donnée dite sensible au sens de la loi n°\u00A02017-28 du 3\u00A0mai 2017, à savoir\u00A0: données relatives à la santé, à l'origine raciale ou ethnique, aux opinions politiques, philosophiques ou religieuses, à l'appartenance syndicale, à la vie ou à l'orientation sexuelle, ainsi que les données génétiques et biométriques. Les utilisateurs sont invités à ne jamais transmettre de telles données via les formulaires, commentaires ou messages du Site.",
        },
        {
          heading: '4. Finalités du traitement',
          text: "Les données collectées sont traitées pour les finalités suivantes\u00A0: gestion des comptes utilisateurs et des abonnements\u00A0; envoi de la newsletter et des communications éditoriales (via Beehiiv et Resend)\u00A0; personnalisation de l'expérience utilisateur\u00A0; amélioration des services et analyse d'audience agrégée\u00A0; gestion des paiements et de la facturation\u00A0; respect des obligations légales, comptables et réglementaires\u00A0; prévention des fraudes et sécurité du Site. Aucune autre finalité incompatible ne sera poursuivie sans information préalable de l'utilisateur.",
        },
        {
          heading: '5. Base juridique du traitement',
          text: "Conformément à la loi nigérienne n°\u00A02017-28 du 3\u00A0mai 2017 relative à la protection des données à caractère personnel et aux textes de la CEDEAO en la matière, les traitements de données sont fondés sur\u00A0: le consentement de l'utilisateur (inscription à la newsletter, création de compte, cookies non essentiels)\u00A0; l'exécution d'un contrat (gestion de l'abonnement premium et des services associés)\u00A0; l'intérêt légitime de NFI Report (analyse d'audience, amélioration des services, sécurité du Site, lutte contre la fraude)\u00A0; le respect d'obligations légales (conservation des données de facturation et d'identification).",
        },
        {
          heading: '6. Durée de conservation',
          text: "Les données personnelles sont conservées pendant la durée strictement nécessaire aux finalités pour lesquelles elles sont collectées\u00A0: données de compte pendant toute la durée de l'inscription, puis 12\u00A0mois après la suppression du compte\u00A0; données de paiement et de facturation conformément aux obligations comptables et fiscales nigériennes (10\u00A0ans)\u00A0; données de navigation et cookies d'analyse 13\u00A0mois maximum\u00A0; données de newsletter jusqu'au désabonnement de l'utilisateur. À l'expiration de ces délais, les données sont supprimées ou anonymisées de manière irréversible.",
        },
        {
          heading: '7. Destinataires des données',
          text: "Les données personnelles peuvent être transmises aux sous-traitants techniques suivants, dans le strict cadre des finalités décrites\u00A0: Supabase (hébergement de la base de données et authentification)\u00A0; Vercel (hébergement du Site)\u00A0; Stripe (traitement sécurisé des paiements)\u00A0; Beehiiv (gestion de la newsletter)\u00A0; Resend (envoi d'emails transactionnels)\u00A0; PostHog (analyse d'audience)\u00A0; Sentry (suivi technique des erreurs). Ces sous-traitants sont liés à NFI Report par des engagements contractuels garantissant un niveau de sécurité et de confidentialité conforme à la réglementation applicable. NFI Report ne vend, ne loue et ne cède jamais vos données personnelles à des tiers à des fins commerciales ou publicitaires.",
        },
        {
          heading: '8. Transferts de données hors du Niger',
          text: "Certains sous-traitants étant établis en dehors du Niger et de l'espace CEDEAO (notamment aux États-Unis), des transferts de données peuvent avoir lieu. Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types, mesures techniques et organisationnelles, certifications de sécurité reconnues) afin d'assurer un niveau de protection adéquat, conformément à la loi n°\u00A02017-28 et aux standards internationaux en vigueur.",
        },
        {
          heading: '9. Cookies et technologies de suivi',
          text: "Le Site utilise des cookies strictement nécessaires à son fonctionnement (authentification, préférences de session, sécurité) et des cookies d'analyse d'audience (PostHog). Les cookies strictement nécessaires ne requièrent pas de consentement préalable. Pour les cookies d'analyse et de mesure, votre consentement est recueilli lors de votre première visite et peut être retiré à tout moment. Vous pouvez également modifier vos préférences via les paramètres de votre navigateur.",
        },
        {
          heading: '10. Sécurité des données',
          text: "NFI Report met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, altération, divulgation ou destruction\u00A0: chiffrement des communications (HTTPS/TLS)\u00A0; authentification sécurisée et hachage des mots de passe\u00A0; accès restreint aux données selon le principe du moindre privilège\u00A0; journalisation, surveillance et détection des intrusions\u00A0; sauvegardes régulières et chiffrées. En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, NFI Report s'engage à notifier la Haute Autorité de Protection des Données à Caractère Personnel (HAPDP) du Niger dans les meilleurs délais et, lorsque la législation l'exige, à vous en informer directement.",
        },
        {
          heading: '11. Prise de décision automatisée et profilage',
          text: "NFI Report n'utilise aucun système de prise de décision entièrement automatisée produisant des effets juridiques à votre égard ou vous affectant de manière significative. Les outils de recommandation éditoriale éventuellement utilisés ne visent qu'à améliorer la pertinence des contenus proposés et peuvent être désactivés à votre demande.",
        },
        {
          heading: '12. Vos droits',
          text: "Conformément à la loi n°\u00A02017-28 du 3\u00A0mai 2017 relative à la protection des données à caractère personnel, vous disposez des droits suivants\u00A0: droit d'accès à vos données personnelles\u00A0; droit de rectification des données inexactes ou incomplètes\u00A0; droit à l'effacement de vos données (dans les limites légales)\u00A0; droit d'opposition au traitement de vos données pour des motifs légitimes\u00A0; droit à la limitation du traitement\u00A0; droit à la portabilité de vos données\u00A0; droit de retirer votre consentement à tout moment, sans que ce retrait ne remette en cause la licéité des traitements antérieurs\u00A0; droit de définir des directives relatives au sort de vos données après votre décès. Pour exercer ces droits, adressez votre demande, accompagnée d'un justificatif d'identité, à contact@nfireport.com. NFI Report s'engage à répondre dans un délai maximum de 30\u00A0jours. En cas de réponse insatisfaisante, vous pouvez introduire une réclamation auprès de la Haute Autorité de Protection des Données à Caractère Personnel (HAPDP) du Niger.",
        },
        {
          heading: '13. Mineurs',
          text: "Le Site n'est pas destiné aux personnes âgées de moins de 16\u00A0ans. NFI Report ne collecte pas sciemment de données personnelles concernant des mineurs. Si un parent ou un représentant légal constate qu'un enfant a fourni des données personnelles sans autorisation, il est invité à contacter NFI Report afin que ces données soient supprimées dans les plus brefs délais.",
        },
        {
          heading: '14. Modifications de la politique',
          text: "NFI Report se réserve le droit de modifier la présente politique de confidentialité à tout moment afin de l'adapter à l'évolution de ses services, de la législation ou des pratiques du secteur. Les utilisateurs seront informés de toute modification substantielle par une notification sur le Site ou par email. La version en vigueur est celle accessible sur le Site à la date de consultation.",
        },
        {
          heading: '15. Contact',
          text: "Pour toute question relative à la présente politique de confidentialité ou à l'exercice de vos droits, vous pouvez écrire à contact@nfireport.com.",
        },
      ]}
    />
  );
}
