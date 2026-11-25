import type { Metadata } from 'next';
import Link from 'next/link';
import { CategoryHero } from '@/components/CategoryHero';
import { AjusteurLignes } from '@/components/apprendre/AjusteurLignes';
import { encadreBceao } from '@/lib/bceao';
import { lireSeanceComplete, lireSeancesBrvm, SYMBOLE_BOA_NIGER } from '@/lib/brvm-seances';
import { dateLongueFr } from '@/lib/cours-du-jour';
import { typographieFr } from '@/lib/typographie-fr';
import { DETTE_PUBLIQUE } from '@/data/niger-chiffres';

/**
 * « Qui fait quoi dans la finance de l'UEMOA » (25/11/2026), ouverte depuis la
 * page Finance. Idée de Raouf : « la BCEAO, l'UEMOA, ce sont des acteurs
 * importants, plein de gens ne comprennent pas ce qu'ils font, et il n'y a pas
 * qu'eux ».
 *
 * Cadre éditorial, tenu ligne par ligne : ce que fait chaque institution et ce
 * que cela change pour l'argent du lecteur, par les mécanismes et les chiffres.
 * Ni histoire du franc CFA, ni débat sur l'avenir de l'Union : la politique et
 * les références étrangères sont hors du champ de NFI Report. Chaque fait a été
 * vérifié sur les sites des institutions le 25/11/2026 ; les chiffres se lisent
 * seuls (BCEAO, relevé de la BRVM) ou viennent de l'INS, et disparaissent si
 * leur source ne répond plus.
 */

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'BCEAO, UEMOA, BRVM : qui fait quoi dans la finance de l’UEMOA',
  description:
    'Ce que font la BCEAO, l’UEMOA, la BRVM, l’AMF-UMOA et UMOA-Titres, et ce que cela change pour votre argent au Niger : taux directeur, crédit, épargne, Bourse.',
  alternates: { canonical: '/finance/institutions' },
};

const NB = ' ';

const nombre = (valeur: number, decimales: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(valeur);

interface Chiffre {
  libelle: string;
  valeur: string;
  detail?: string;
}

interface Institution {
  id: string;
  nom: string;
  role: string;
  /** Une phrase par paragraphe : un début de phrase ne reste jamais en bout de ligne. */
  presentation: string[];
  pourVous: string[];
  chiffres: Chiffre[];
  sourceChiffres?: string;
  site: { libelle: string; url: string };
  lienInterne?: { libelle: string; href: string };
}

function BlocInstitution({ institution }: { institution: Institution }) {
  return (
    <section id={institution.id} aria-labelledby={`${institution.id}-titre`} className="scroll-mt-24 border-t border-black/10 pt-10">
      <h2 id={`${institution.id}-titre`} className="text-[24px] font-bold tracking-[-0.01em] text-[#111]">
        {institution.nom}
      </h2>
      <p className="mt-1 text-[17px] text-gray-500">{typographieFr(institution.role)}</p>
      {institution.presentation.map((phrase, index) => (
        <p key={phrase} className={`${index === 0 ? 'mt-4' : 'mt-2'} text-[16px] leading-relaxed text-gray-800`}>
          {typographieFr(phrase)}
        </p>
      ))}

      <h3 className="mt-6 text-[17px] font-bold text-[#111]">Ce que cela change pour vous</h3>
      {/* Puces natives : une puce dessinée en bloc dans le li empêchait le réglage des fins de ligne. */}
      <ul className="mt-3 list-disc space-y-2.5 pl-5 marker:text-[#111]">
        {institution.pourVous.map((texte) => (
          <li key={texte} className="pl-1 text-[16px] leading-relaxed text-gray-800">
            {typographieFr(texte)}
          </li>
        ))}
      </ul>

      {institution.chiffres.length > 0 ? (
        <div className="mt-6 rounded-xl border border-black/10 bg-white px-4 py-4 sm:px-5">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {institution.chiffres.map((c) => (
              <div key={c.libelle}>
                <dt className="text-[13px] text-gray-500">{c.libelle}</dt>
                <dd className="mt-0.5 text-[21px] font-bold tracking-tight tabular-nums text-[#111]">{c.valeur}</dd>
                {c.detail ? <dd className="text-[13px] text-gray-500">{c.detail}</dd> : null}
              </div>
            ))}
          </dl>
          {institution.sourceChiffres ? <p className="mt-3 text-[13px] text-gray-500">{typographieFr(institution.sourceChiffres)}</p> : null}
        </div>
      ) : null}

      <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
        <a
          href={institution.site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#111] underline underline-offset-4 hover:no-underline"
        >
          {institution.site.libelle}
        </a>
        {institution.lienInterne ? (
          <Link href={institution.lienInterne.href} className="font-semibold text-[#111] underline underline-offset-4 hover:no-underline">
            {institution.lienInterne.libelle}
          </Link>
        ) : null}
      </p>
    </section>
  );
}

function Autre({ nom, texte }: { nom: string; texte: string }) {
  return (
    <li>
      <h3 className="text-[16px] font-semibold text-[#111]">{typographieFr(nom)}</h3>
      <p className="mt-0.5 text-[16px] leading-relaxed text-gray-800">{typographieFr(texte)}</p>
    </li>
  );
}

export default async function InstitutionsPage() {
  const [encadre, composite, seance] = await Promise.all([
    encadreBceao().catch(() => null),
    lireSeancesBrvm('composite').catch(() => []),
    lireSeanceComplete().catch(() => null),
  ]);
  const taux = encadre?.taux ?? null;
  const uemoa = encadre?.uemoa ?? null;
  const derniereSeance = composite.at(-1) ?? null;
  const boan = seance?.actions.find((a) => a.symbole === SYMBOLE_BOA_NIGER) ?? null;

  const chiffresBceao: Chiffre[] = taux
    ? [
        { libelle: 'Taux directeur', valeur: `${nombre(taux.principal, 2)}${NB}%`, detail: `depuis le ${dateLongueFr(taux.depuis)}` },
        ...(taux.pretMarginal !== null
          ? [{ libelle: 'Taux du prêt marginal', valeur: `${nombre(taux.pretMarginal, 2)}${NB}%`, detail: 'pour les besoins urgents des banques' }]
          : []),
      ]
    : [];

  const chiffresUemoa: Chiffre[] = [
    ...(uemoa?.croissance !== null && uemoa?.croissance !== undefined && uemoa.anneeEstimations
      ? [{ libelle: `Croissance de l’Union en ${uemoa.anneeEstimations}`, valeur: `${nombre(uemoa.croissance, 1)}${NB}%`, detail: 'estimation de la BCEAO' }]
      : []),
    ...(uemoa?.inflation
      ? [{ libelle: `Inflation de l’Union en ${uemoa.inflation.annee}`, valeur: `${nombre(uemoa.inflation.valeur, 1)}${NB}%`, detail: 'en moyenne sur l’année' }]
      : []),
    { libelle: 'Dette publique du Niger en 2025', valeur: `${nombre(DETTE_PUBLIQUE.totale, 1)}${NB}%${NB}du${NB}PIB`, detail: `pour un plafond de ${DETTE_PUBLIQUE.plafondUemoa}${NB}%` },
  ];

  const chiffresBrvm: Chiffre[] = [
    ...(derniereSeance
      ? [{ libelle: 'BRVM Composite', valeur: nombre(derniereSeance.cloture, 2), detail: `clôture du ${dateLongueFr(derniereSeance.date)}` }]
      : []),
    ...(boan ? [{ libelle: 'Bank of Africa Niger', valeur: `${nombre(boan.cloture, 0)}${NB}FCFA`, detail: 'cours de clôture' }] : []),
  ];

  const nombreActions = seance?.actions.length ?? null;

  const institutions: Institution[] = [
    {
      id: 'bceao',
      nom: 'La BCEAO',
      role: 'La banque centrale des huit pays',
      presentation: [
        'La Banque centrale des États de l’Afrique de l’Ouest émet le franc CFA et conduit la politique monétaire des huit pays de l’Union, depuis son siège de Dakar.',
      ],
      pourVous: [
        'Son taux directeur fixe le prix auquel les banques empruntent auprès d’elle : quand il monte, le crédit coûte plus cher aux ménages comme aux entreprises.',
        'Elle cherche à maintenir l’inflation entre 1 % et 3 % par an, pour protéger le pouvoir d’achat.',
        'Elle encadre les banques, la microfinance et le mobile money.',
      ],
      chiffres: chiffresBceao,
      sourceChiffres: taux ? 'Taux lus chaque jour sur le site de la BCEAO.' : undefined,
      site: { libelle: 'Le site de la BCEAO', url: 'https://www.bceao.int' },
      lienInterne: { libelle: 'Les cours du jour', href: '/marches' },
    },
    {
      id: 'uemoa',
      nom: 'L’UEMOA',
      role: 'L’union économique',
      presentation: [
        'L’Union économique et monétaire ouest-africaine réunit le Bénin, le Burkina Faso, la Côte d’Ivoire, la Guinée-Bissau, le Mali, le Niger, le Sénégal et le Togo.',
        'Sa Commission, son organe exécutif, siège à Ouagadougou.',
      ],
      pourVous: [
        'Son union douanière supprime les droits de douane sur les produits originaires des huit pays, et applique un tarif commun aux importations venues d’ailleurs.',
        'Ses règles budgétaires plafonnent le déficit public à 3 % du PIB et la dette publique à 70 % du PIB, dans chacun des huit pays.',
      ],
      chiffres: chiffresUemoa,
      sourceChiffres:
        uemoa?.miseAJour
          ? `Chiffres de l’Union : BCEAO, mis à jour le ${dateLongueFr(uemoa.miseAJour)}. Dette du Niger : INS, comptes économiques rapides 2025.`
          : 'Dette du Niger : INS, comptes économiques rapides 2025.',
      site: { libelle: 'Le site de l’UEMOA', url: 'https://www.uemoa.int' },
      lienInterne: { libelle: 'Le Niger en chiffres', href: '/niger' },
    },
    {
      id: 'brvm',
      nom: 'La BRVM',
      role: 'La Bourse commune',
      presentation: [
        'La Bourse régionale des valeurs mobilières, installée à Abidjan, est la Bourse des huit pays.',
        'Son dépositaire central, le DC/BR, conserve les titres et règle les achats et les ventes.',
      ],
      pourVous: [
        'Pour acheter une action ou une obligation, il faut ouvrir un compte titres dans une SGI, une société de gestion et d’intermédiation.',
        nombreActions
          ? `Bank of Africa Niger est la seule société nigérienne parmi les ${nombreActions} sociétés cotées.`
          : 'Bank of Africa Niger est la seule société nigérienne cotée.',
      ],
      chiffres: chiffresBrvm,
      sourceChiffres: chiffresBrvm.length > 0 ? 'Cours relevés chaque soir de séance sur le site de la BRVM.' : undefined,
      site: { libelle: 'Le site de la BRVM', url: 'https://www.brvm.org' },
      lienInterne: { libelle: 'La séance du jour', href: '/marches' },
    },
    {
      id: 'amf-umoa',
      nom: 'L’AMF-UMOA',
      role: 'Le gendarme de la Bourse',
      presentation: [
        'L’Autorité des marchés financiers de l’UMOA surveille le marché financier régional.',
        'Elle s’appelait auparavant le CREPMF, le Conseil régional de l’épargne publique et des marchés financiers.',
      ],
      pourVous: [
        'Elle agrée les SGI et les sociétés de gestion : aucune n’exerce sans son autorisation.',
        'Elle contrôle les emprunts et les titres proposés au public avant leur vente.',
        'Avant de confier votre épargne à un intermédiaire, vérifiez auprès d’elle qu’il est agréé.',
      ],
      chiffres: [],
      site: { libelle: 'Le site de l’AMF-UMOA', url: 'https://www.amf-umoa.org' },
    },
    {
      id: 'umoa-titres',
      nom: 'UMOA-Titres',
      role: 'Là où les États empruntent',
      presentation: [
        'L’Agence UMOA-Titres, basée à Dakar, organise avec la BCEAO les emprunts des huit États sur le marché régional des titres publics.',
      ],
      pourVous: [
        'Les États y vendent des bons du Trésor à court terme et des obligations à plus long terme, en retenant les offres les plus avantageuses.',
        'Le Niger y emprunte régulièrement pour financer son budget.',
        'Un particulier peut y souscrire par l’intermédiaire d’une banque ou d’une SGI de l’Union.',
      ],
      chiffres: [],
      site: { libelle: 'Le site d’UMOA-Titres', url: 'https://www.umoatitres.org' },
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <CategoryHero
        title={`Qui fait quoi dans${NB}la${NB}finance`}
        description="Voici ce que font la BCEAO, l’UEMOA, la BRVM, l’AMF-UMOA et UMOA-Titres, et ce que cela change pour votre argent au Niger."
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-16 md:pb-20">
        <nav aria-label="Les institutions de la page" className="mb-10">
          <ul className="flex flex-wrap gap-2">
            {institutions.map((i) => (
              <li key={i.id}>
                <a
                  href={`#${i.id}`}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-black/10 bg-white px-4 text-[15px] font-semibold text-[#111] hover:border-black/30"
                >
                  {i.nom.replace(/^(La |L’)/, '')}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <AjusteurLignes>
          <div className="space-y-12">
            {institutions.map((i) => (
              <BlocInstitution key={i.id} institution={i} />
            ))}

            <section aria-labelledby="autres-titre" className="border-t border-black/10 pt-10">
              <h2 id="autres-titre" className="text-[24px] font-bold tracking-[-0.01em] text-[#111]">
                D’autres institutions comptent aussi
              </h2>
              <ul className="mt-5 space-y-4">
                <Autre nom="La BOAD" texte="La Banque ouest-africaine de développement, installée à Lomé, finance des routes, de l’énergie et d’autres projets dans les huit pays." />
                <Autre nom="La Commission bancaire de l’UMOA" texte="Elle contrôle les banques de l’Union et peut les sanctionner." />
                <Autre nom="Le FGDR-UMOA" texte="Le Fonds de garantie des dépôts et de résolution indemnise les déposants si leur banque ou leur institution de microfinance fait faillite, jusqu’à un plafond fixé par les ministres de l’Union." />
                <Autre nom="La CIMA" texte="La Conférence interafricaine des marchés d’assurances encadre les assureurs du Niger et de plusieurs autres pays africains." />
              </ul>
            </section>

            <section aria-labelledby="mention-titre" className="border-t border-black/10 pt-8">
              <h2 id="mention-titre" className="sr-only">
                Mention
              </h2>
              {[
                'Ces informations sont données à titre indicatif, à jour en novembre 2026.',
                'Elles peuvent évoluer : vérifiez-les auprès de l’institution concernée avant toute démarche.',
                'Elles ne constituent pas un conseil d’investissement.',
              ].map((phrase) => (
                <p key={phrase} className="text-[14px] leading-relaxed text-gray-500">
                  {typographieFr(phrase)}
                </p>
              ))}
            </section>
          </div>
        </AjusteurLignes>
      </div>
    </div>
  );
}
