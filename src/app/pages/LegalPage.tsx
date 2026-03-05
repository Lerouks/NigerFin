import { useLocation, Link } from 'react-router';

const legalContent: Record<string, { title: string; content: { heading: string; text: string }[] }> = {
  '/mentions-legales': {
    title: 'Mentions Légales',
    content: [
      {
        heading: 'Éditeur du site',
        text: 'NFI REPORT est édité par NFI Media SARL, société de droit nigérien au capital de 10 000 000 FCFA. Siège social : Boulevard de la République, Quartier Plateau, Niamey, Niger. RCCM : NI-NIA-2024-B-XXXX. NIF : XXXXXXXXX.',
      },
      {
        heading: 'Directeur de publication',
        text: 'Le directeur de publication est le représentant légal de NFI Media SARL.',
      },
      {
        heading: 'Hébergement',
        text: 'Le site est hébergé par des serveurs sécurisés conformes aux normes internationales de protection des données.',
      },
      {
        heading: 'Propriété intellectuelle',
        text: 'L\'ensemble du contenu du site NFI REPORT (articles, analyses, graphiques, logos, images) est protégé par les lois nigériennes et internationales relatives à la propriété intellectuelle. Toute reproduction, même partielle, est soumise à autorisation préalable.',
      },
      {
        heading: 'Responsabilité',
        text: 'Les informations publiées sur NFI REPORT sont fournies à titre informatif uniquement et ne constituent en aucun cas un conseil en investissement. NFI REPORT ne saurait être tenu responsable des décisions prises sur la base des informations publiées sur le site.',
      },
    ],
  },
  '/confidentialite': {
    title: 'Politique de Confidentialité',
    content: [
      {
        heading: 'Collecte des données',
        text: 'NFI REPORT collecte uniquement les données nécessaires au bon fonctionnement de ses services : adresse email (inscription newsletter), données de navigation anonymisées, et informations de compte pour les abonnés.',
      },
      {
        heading: 'Utilisation des données',
        text: 'Vos données sont utilisées exclusivement pour : l\'envoi de la newsletter, la personnalisation de votre expérience de lecture, l\'amélioration de nos services, et la gestion de votre abonnement.',
      },
      {
        heading: 'Protection des données',
        text: 'Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction.',
      },
      {
        heading: 'Vos droits',
        text: 'Conformément à la législation en vigueur, vous disposez d\'un droit d\'accès, de rectification, de suppression et de portabilité de vos données personnelles. Pour exercer ces droits, contactez-nous à : contact@nfireport.ne.',
      },
    ],
  },
  '/cgu': {
    title: 'Conditions Générales d\'Utilisation',
    content: [
      {
        heading: 'Objet',
        text: 'Les présentes conditions générales d\'utilisation régissent l\'accès et l\'utilisation du site NFI REPORT. En accédant au site, vous acceptez sans réserve les présentes conditions.',
      },
      {
        heading: 'Accès au service',
        text: 'L\'accès aux articles gratuits est ouvert à tous. L\'accès au contenu premium nécessite la création d\'un compte et la souscription d\'un abonnement payant.',
      },
      {
        heading: 'Abonnement Premium',
        text: 'L\'abonnement Premium donne accès à l\'ensemble du contenu du site, aux outils d\'analyse avancés et aux indices économiques. L\'abonnement est renouvelable et peut être résilié à tout moment.',
      },
      {
        heading: 'Commentaires',
        text: 'Les utilisateurs inscrits peuvent publier des commentaires. Tout commentaire contraire aux lois en vigueur, diffamatoire, injurieux ou à caractère publicitaire sera supprimé sans préavis.',
      },
      {
        heading: 'Modification des CGU',
        text: 'NFI REPORT se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés des modifications par email ou par notification sur le site.',
      },
    ],
  },
  '/cookies': {
    title: 'Politique de Cookies',
    content: [
      {
        heading: 'Qu\'est-ce qu\'un cookie ?',
        text: 'Un cookie est un petit fichier texte déposé sur votre terminal lors de votre visite sur notre site. Il nous permet de vous reconnaître et de mémoriser vos préférences.',
      },
      {
        heading: 'Cookies utilisés',
        text: 'Nous utilisons des cookies strictement nécessaires au fonctionnement du site, des cookies d\'analyse pour améliorer nos services, et des cookies de personnalisation pour adapter le contenu à vos centres d\'intérêt.',
      },
      {
        heading: 'Gestion des cookies',
        text: 'Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres de votre navigateur. Le refus de certains cookies peut limiter votre accès à certaines fonctionnalités du site.',
      },
    ],
  },
  '/publicite': {
    title: 'Publicité & Partenariats',
    content: [
      {
        heading: 'Opportunités publicitaires',
        text: 'NFI REPORT offre des opportunités publicitaires premium pour toucher une audience qualifiée de professionnels, investisseurs et décideurs au Niger et en Afrique de l\'Ouest.',
      },
      {
        heading: 'Formats disponibles',
        text: 'Nous proposons différents formats : bannières display, articles sponsorisés, newsletters dédiées, et partenariats événementiels. Chaque format est conçu pour maximiser l\'engagement auprès de notre audience.',
      },
      {
        heading: 'Notre audience',
        text: 'Notre lectorat est composé principalement de cadres dirigeants, d\'entrepreneurs, d\'investisseurs et de professionnels du secteur financier en Afrique de l\'Ouest, avec un focus particulier sur le Niger.',
      },
      {
        heading: 'Contact commercial',
        text: 'Pour toute demande de partenariat ou de publicité, contactez notre équipe commerciale à : publicite@nfireport.ne ou au +227 20 73 XX XX.',
      },
    ],
  },
};

export function LegalPage() {
  const location = useLocation();
  const page = legalContent[location.pathname];

  if (!page) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Page introuvable</h1>
          <Link to="/" className="text-black underline hover:no-underline">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <section className="bg-[#111] text-white py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl">{page.title}</h1>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-7 md:p-10 border border-black/[0.06]">
            <div className="space-y-10">
              {page.content.map((section, index) => (
                <div key={index}>
                  <h2 className="text-xl font-bold mb-3">{section.heading}</h2>
                  <p className="text-gray-600 leading-relaxed">{section.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-[12px] text-gray-400">
                Dernière mise à jour : 1er mars 2026
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}