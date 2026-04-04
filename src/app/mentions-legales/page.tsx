import type { Metadata } from 'next';
import { DynamicLegalPage } from '@/components/DynamicLegalPage';

export const revalidate = 86400;

export const metadata: Metadata = { title: 'Mentions Légales', description: 'Mentions légales de NFI Report : éditeur, hébergeur, propriété intellectuelle et conditions d\'utilisation du site.' };

export default function MentionsLegalesPage() {
  return (
    <DynamicLegalPage
      slug="mentions-legales"
      title="Mentions Légales"
      fallbackSections={[
        {
          heading: '1. Éditeur du site',
          text: "Le site NFI Report (ci-après « le Site ») est édité par NFI Report, société de droit nigérien. Siège social : Niamey, Niger. Email : contact@nfireport.com. Directeur de la publication : le représentant légal de NFI Report. Le Site est un service de presse en ligne spécialisé dans l'information économique et financière relative au Niger et à l'Afrique de l'Ouest.",
        },
        {
          heading: '2. Hébergement',
          text: 'Le Site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (https://vercel.com). Les données sont stockées par Supabase Inc., San Francisco, CA, États-Unis. En cas de transfert de données hors du Niger, des garanties appropriées sont mises en place conformément à la réglementation applicable.',
        },
        {
          heading: '3. Propriété intellectuelle',
          text: "L'ensemble des contenus du Site (articles, analyses, graphiques, logos, marques, base de données, structure, logiciels) est protégé par les lois nigériennes et les conventions internationales relatives à la propriété intellectuelle, notamment l'Accord de Bangui révisé instituant l'Organisation Africaine de la Propriété Intellectuelle (OAPI). Toute reproduction, représentation, diffusion ou exploitation, totale ou partielle, des contenus du Site, par quelque procédé que ce soit, sans l'autorisation écrite préalable de NFI Report, est strictement interdite et constitue une contrefaçon sanctionnée par les textes en vigueur.",
        },
        {
          heading: '4. Responsabilité éditoriale',
          text: "Les informations publiées sur le Site sont fournies à titre informatif et ne constituent en aucun cas des conseils en investissement, des recommandations financières ou des incitations à l'achat ou à la vente d'instruments financiers. NFI Report s'efforce de fournir des informations exactes et à jour, mais ne garantit ni l'exhaustivité, ni l'exactitude, ni l'actualité des contenus publiés. L'utilisateur reconnaît utiliser ces informations sous sa seule responsabilité. NFI Report décline toute responsabilité en cas de pertes financières, dommages directs ou indirects résultant de l'utilisation des informations diffusées sur le Site.",
        },
        {
          heading: '5. Données de marché et indicateurs financiers',
          text: "Les données de marché, cours, indices et indicateurs économiques affichés sur le Site proviennent de sources considérées comme fiables (BCEAO, BRVM, institutions publiques, agences officielles). Cependant, NFI Report ne saurait être tenu responsable d'éventuelles erreurs, omissions ou retards dans la mise à jour de ces données. Ces informations ne se substituent pas aux données officielles des institutions concernées.",
        },
        {
          heading: '6. Limitation de responsabilité',
          text: "NFI Report ne saurait être tenu responsable : des interruptions temporaires du Site pour maintenance ou mise à jour ; des dommages résultant de l'utilisation ou de l'impossibilité d'utiliser le Site ; des contenus de sites tiers vers lesquels des liens hypertextes peuvent renvoyer ; de tout préjudice résultant d'un accès non autorisé au Site ou d'une intrusion malveillante. L'utilisateur est seul responsable de l'utilisation qu'il fait des contenus du Site et des décisions qu'il prend sur la base de ces informations.",
        },
        {
          heading: '7. Contenus utilisateurs et commentaires',
          text: "Les utilisateurs qui publient des commentaires ou participent aux discussions sur le Site sont seuls responsables de leurs contributions. NFI Report se réserve le droit de modérer, modifier ou supprimer tout contenu contraire aux lois en vigueur au Niger, à l'ordre public, aux bonnes mœurs, ou aux présentes mentions légales, sans préavis ni justification.",
        },
        {
          heading: '8. Abonnements et paiements',
          text: "Les abonnements premium sont régis par les conditions générales de vente accessibles lors du processus de souscription. Les paiements sont traités de manière sécurisée par Stripe. NFI Report ne stocke aucune donnée bancaire sur ses serveurs. Les tarifs sont indiqués en francs CFA (XOF) et sont susceptibles de modification avec un préavis raisonnable aux abonnés.",
        },
        {
          heading: '9. Droit applicable et juridiction compétente',
          text: "Les présentes mentions légales sont régies par le droit de la République du Niger. En cas de litige relatif à l'utilisation du Site, les parties s'engagent à rechercher une solution amiable. À défaut d'accord amiable, les tribunaux compétents de Niamey (Niger) seront seuls compétents pour connaître du litige, conformément aux règles de compétence territoriale du Code de procédure civile nigérien.",
        },
        {
          heading: '10. Contact',
          text: 'Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l\'adresse : contact@nfireport.com.',
        },
      ]}
    />
  );
}
