import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Mentions légales : éditeur et hébergeur',
  description: 'Mentions légales de NFI Report : éditeur, hébergeur, propriété intellectuelle et conditions d\'utilisation du site.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegalesPage() {
  return (
    <DynamicLegalPage
      slug="mentions-legales"
      title="Mentions Légales"
      fallbackSections={[
        {
          heading: '1. Éditeur du site',
          text: "Le site NFI Report (ci-après «\u00A0le Site\u00A0») est édité par NFI Report, société de droit nigérien. Siège social\u00A0: Niamey (Niger). Contact\u00A0: contact@nfireport.com. Directeur de la publication\u00A0: le représentant légal de NFI Report. Le Site constitue un service de presse en ligne spécialisé dans l'information économique et financière relative au Niger et à l'Afrique de l'Ouest.",
        },
        {
          heading: '2. Hébergement',
          text: "Le Site est hébergé par Vercel Inc., 440\u00A0N Barranca Ave #4133, Covina, CA\u00A091723, États-Unis (https://vercel.com). Les données applicatives sont stockées par Supabase Inc., San Francisco, CA, États-Unis. En cas de transfert de données hors du Niger, des garanties appropriées sont mises en place conformément à la réglementation applicable.",
        },
        {
          heading: '3. Propriété intellectuelle',
          text: "L'ensemble des contenus du Site (articles, analyses, graphiques, infographies, logos, marques, bases de données, structure, mise en page et logiciels) est protégé par les lois nigériennes et les conventions internationales relatives à la propriété intellectuelle, notamment l'Accord de Bangui révisé instituant l'Organisation Africaine de la Propriété Intellectuelle (OAPI). Toute reproduction, représentation, diffusion, adaptation, traduction ou exploitation, totale ou partielle, des contenus du Site, par quelque procédé que ce soit et sur quelque support que ce soit, sans l'autorisation écrite préalable de NFI Report, est strictement interdite et constitue une contrefaçon sanctionnée par les textes en vigueur. Les citations courtes à des fins d'information sont tolérées sous réserve d'indiquer clairement la source «\u00A0NFI Report\u00A0» et de fournir un lien actif vers l'article d'origine.",
        },
        {
          heading: '4. Responsabilité éditoriale et absence de conseil en investissement',
          text: "Les informations publiées sur le Site sont fournies exclusivement à titre informatif et pédagogique. Elles ne constituent en aucun cas un conseil en investissement, une recommandation personnalisée, une sollicitation, une offre d'achat ou de vente d'instruments financiers, ni un conseil juridique, fiscal ou comptable. NFI Report n'est pas un prestataire de services d'investissement agréé et n'exerce aucune activité réglementée par les autorités de marché. NFI Report s'efforce de fournir des informations exactes, complètes et à jour, mais ne garantit ni l'exhaustivité, ni l'exactitude, ni l'actualité des contenus publiés. L'utilisateur reconnaît utiliser ces informations sous sa seule et entière responsabilité. NFI Report décline toute responsabilité en cas de pertes financières, dommages directs, indirects, matériels ou immatériels résultant de l'utilisation des informations diffusées sur le Site ou d'une décision prise sur la base de ces informations.",
        },
        {
          heading: '5. Données de marché et indicateurs financiers',
          text: "Les données de marché, cours, indices et indicateurs économiques affichés sur le Site proviennent de sources considérées comme fiables (BCEAO, BRVM, institutions publiques, agences officielles). Elles sont fournies à titre indicatif et peuvent comporter des retards, erreurs ou omissions indépendants de la volonté de NFI Report. Elles ne se substituent en aucun cas aux données officielles publiées par les institutions concernées, qui font seules foi. NFI Report ne saurait être tenu responsable de toute décision prise sur la base de ces données.",
        },
        {
          heading: '6. Limitation de responsabilité',
          text: "NFI Report ne saurait être tenu responsable\u00A0: des interruptions temporaires du Site pour maintenance, mise à jour ou cas de force majeure\u00A0; des dommages résultant de l'utilisation ou de l'impossibilité d'utiliser le Site\u00A0; des contenus de sites tiers vers lesquels des liens hypertextes peuvent renvoyer\u00A0; de tout préjudice résultant d'un accès non autorisé au Site ou d'une intrusion malveillante. L'utilisateur est seul responsable de l'utilisation qu'il fait des contenus du Site et des décisions qu'il prend sur la base de ces informations. Dans toute la mesure permise par la loi applicable, la responsabilité cumulée de NFI Report envers un utilisateur ne pourra excéder le montant effectivement payé par cet utilisateur au cours des douze derniers mois au titre de son abonnement.",
        },
        {
          heading: '7. Contenus utilisateurs et commentaires',
          text: "Les utilisateurs qui publient des commentaires, participent aux discussions ou transmettent des contenus sur le Site sont seuls et pleinement responsables de leurs contributions. En publiant un contenu, l'utilisateur garantit qu'il détient les droits nécessaires et concède à NFI Report une licence non exclusive, gratuite et mondiale d'utilisation de ce contenu dans le cadre du Site. NFI Report se réserve le droit, sans préavis ni justification, de modérer, modifier ou supprimer tout contenu contraire aux lois en vigueur au Niger, à l'ordre public, aux bonnes mœurs ou aux présentes mentions légales, et de suspendre ou résilier le compte de tout utilisateur contrevenant.",
        },
        {
          heading: '8. Abonnements et paiements',
          text: "Les abonnements premium sont régis par les conditions générales de vente accessibles lors du processus de souscription. Les paiements sont traités de manière sécurisée par iPayMoney (Mobile Money et carte bancaire) ainsi que par les services Nita et Amana pour les transferts locaux. NFI Report ne stocke aucune donnée bancaire sur ses serveurs. Les tarifs sont indiqués en francs CFA (XOF) et sont susceptibles de modification avec un préavis raisonnable communiqué aux abonnés.",
        },
        {
          heading: '9. Protection des données personnelles',
          text: "Le traitement des données personnelles des utilisateurs est décrit en détail dans la Politique de Confidentialité, accessible depuis le Site, laquelle fait partie intégrante des présentes mentions légales.",
        },
        {
          heading: '10. Droit applicable et juridiction compétente',
          text: "Les présentes mentions légales sont régies par le droit de la République du Niger. En cas de litige relatif à l'utilisation du Site, les parties s'engagent à rechercher une solution amiable avant toute action contentieuse. À défaut d'accord amiable dans un délai raisonnable, les tribunaux compétents de Niamey (Niger) seront seuls compétents pour connaître du litige, conformément aux règles de compétence territoriale du Code de procédure civile nigérien.",
        },
        {
          heading: '11. Contact',
          text: "Pour toute question relative aux présentes mentions légales, vous pouvez écrire à contact@nfireport.com.",
        },
      ]}
    />
  );
}
