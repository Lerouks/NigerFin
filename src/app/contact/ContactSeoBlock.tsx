export function ContactSeoBlock() {
  return (
    <section className="bg-white border-t border-black/6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="prose prose-sm sm:prose-base max-w-none">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mb-4">
            Comment nous joindre
          </h2>
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 text-pretty mb-6 text-justify hyphens-auto">
            L&apos;équipe NFI Report est joignable directement depuis ce formulaire pour toute
            demande relative à notre couverture éditoriale, nos analyses, nos outils financiers
            ou notre offre Premium. Nous nous efforçons de répondre à chaque message dans un
            délai de 48 heures ouvrées. Pour des demandes urgentes liées à un événement de
            marché ou à une publication imminente, mentionnez-le clairement dans l&apos;objet
            de votre message.
          </p>
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 text-pretty mb-10 text-justify hyphens-auto">
            Pour les demandes professionnelles structurées (partenariats stratégiques,
            interviews, prises de parole, reconnaissance de presse), n&apos;hésitez pas à
            joindre votre organisation, votre fonction et un descriptif précis du projet.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mt-10 mb-4">
            Types de demandes que nous traitons
          </h2>
          <ul className="space-y-3 text-[15px] text-gray-700 mb-10">
            <li className="flex items-start gap-3">
              <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Demandes éditoriales</strong> : suggestions de sujets, signalements
                d&apos;informations, corrections, droits de réponse, demandes de clarification
                sur un article publié.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Partenariats stratégiques</strong> : collaboration éditoriale,
                co-production de contenus, échange d&apos;expertise sectorielle avec
                institutions, banques, entreprises et ONG actives au Niger ou en UEMOA.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Publicité et sponsoring</strong> : encarts publicitaires display,
                articles sponsorisés clairement identifiés, newsletters dédiées, partenariats
                événementiels (consultez aussi notre page Publicité).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Demandes presse</strong> : sollicitations d&apos;interviews,
                déclarations officielles, communiqués de presse à diffuser, demandes de
                citations pour autres médias.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Support abonnés Premium</strong> : questions sur l&apos;abonnement,
                facturation, accès aux contenus payants, renouvellement, problèmes techniques.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-gold" />
              <span className="leading-relaxed">
                <strong>Suggestions et retours</strong> : améliorations à apporter au site,
                aux outils financiers, à la newsletter, à l&apos;offre éditoriale en général.
              </span>
            </li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#111] mt-10 mb-4">
            Confidentialité de vos messages
          </h2>
          <p className="text-[15px] sm:text-[16px] leading-relaxed text-gray-700 text-pretty text-justify hyphens-auto">
            Toutes les communications adressées à NFI Report sont traitées de manière
            confidentielle. Vos données personnelles (nom, email, téléphone) sont conservées
            uniquement pour répondre à votre demande, pendant une durée maximale de 12&nbsp;mois.
            Elles ne sont jamais partagées avec des tiers à des fins commerciales et vous
            pouvez à tout moment demander leur suppression conformément à notre politique de
            confidentialité et à la loi nigérienne n°&nbsp;2017-28 sur la protection des données
            personnelles.
          </p>
        </div>
      </div>
    </section>
  );
}
