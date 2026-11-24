'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Loader2 } from 'lucide-react';
import { PhoneField, validatePhone } from '@/components/PhoneField';
import { criteresMotDePasse, erreurMotDePasse, MOT_DE_PASSE_MAX } from '@/lib/mot-de-passe';
import { dateFr, dureeDeFormule, montantFcfa, telephoneLisible, type EtatAbonnement, type FactureDuCompte } from '@/lib/compte';

/**
 * « Mon compte », la présentation seule (maquette A « Cadre », choisie par
 * Raouf le 24/11/2026) : un bandeau noir, un sommaire, puis une fiche par
 * rubrique. Aucune requête ici : AccountDashboard fournit les données et les
 * actions, ce qui permet de contrôler la page sur tous les écrans avec des
 * données d'exemple.
 *
 * Typographie : \u00A0 (insécable) et \u202F (fine insécable) gardent ensemble
 * ce qui ne doit pas se couper ; les derniers mots d'une phrase sont soudés
 * (whitespace-nowrap) pour qu'aucune ligne ne finisse sur deux ou trois mots.
 */

const NB = '\u00A0';
const FINE = '\u202F';

export interface ProfilAffiche {
  civilite: 'M.' | 'Mme' | '';
  prenom: string;
  nom: string;
  profession: string;
  telephone: string;
  adresse: string;
  ville: string;
  codePostal: string;
  pays: string;
  jourNaissance: string;
  moisNaissance: string;
  anneeNaissance: string;
}

export interface DonneesCompte {
  salutation: string;
  email: string;
  membreDepuis: string | null;
  role: 'reader' | 'premium' | 'admin';
  abonnement: EtatAbonnement;
  /** undefined : en cours de chargement ; null : lecture impossible. */
  factures: FactureDuCompte[] | null | undefined;
  profil: ProfilAffiche;
  connexion: { motDePasse: boolean; google: boolean } | undefined;
  /** undefined : en cours de chargement ; null : indisponible (adresse non confirmée). */
  newsletter: { recoit: boolean; bloquee: boolean } | null | undefined;
  /** Le résumé du compte n'a pas pu être lu (réseau, serveur). */
  erreurChargement: boolean;
  /** Arrivée par le lien « mot de passe oublié » : on définit un nouveau mot de passe sans l'ancien. */
  reinitialisation: boolean;
  /** Prix mensuel affiché aux lecteurs, en FCFA. */
  prixMensuel: number;
}

export interface Reponse {
  ok: boolean;
  message: string;
  /** Le serveur demande de se reconnecter avec Google avant de créer un mot de passe. */
  reconnexion?: boolean;
  /** La suppression est refusée : le compte a des factures, que la base garde attachées. */
  factures?: boolean;
}

export interface ActionsCompte {
  enregistrerProfil: (profil: ProfilAffiche) => Promise<Reponse>;
  changerMotDePasse: (entree: { actuel: string | null; nouveau: string }) => Promise<Reponse>;
  changerNewsletter: (recevoir: boolean) => Promise<Reponse & { etat?: { recoit: boolean; bloquee: boolean } }>;
  deconnexion: () => Promise<void>;
  deconnexionPartout: () => Promise<Reponse>;
  supprimerCompte: () => Promise<Reponse>;
}

const RUBRIQUES = [
  { id: 'abonnement', court: 'Abonnement' },
  { id: 'factures', court: 'Factures' },
  { id: 'informations', court: 'Informations' },
  { id: 'securite', court: 'Sécurité' },
  { id: 'newsletter', court: 'Newsletter' },
] as const;

const PAYS_AFRIQUE_OUEST = [
  'Niger', 'Nigeria', 'Bénin', 'Burkina Faso', 'Côte d’Ivoire', 'Ghana',
  'Guinée', 'Guinée-Bissau', 'Liberia', 'Mali', 'Mauritanie', 'Sénégal',
  'Sierra Leone', 'Togo', 'Cap-Vert', 'Gambie',
];
const AUTRES_PAYS = [
  'Algérie', 'Cameroun', 'Canada', 'Centrafrique', 'Comores', 'Congo',
  'Djibouti', 'Égypte', 'Éthiopie', 'France', 'Gabon', 'Kenya',
  'Madagascar', 'Maroc', 'RD Congo', 'Rwanda', 'Tchad', 'Tunisie',
  'Belgique', 'Suisse', 'États-Unis', 'Royaume-Uni', 'Allemagne',
  'Arabie saoudite', 'Émirats arabes unis', 'Chine', 'Inde', 'Autre',
];
const PROFESSIONS = [
  'Entrepreneur', 'Fonctionnaire', 'Cadre d’entreprise', 'Commerçant', 'Agriculteur',
  'Enseignant / Chercheur', 'Étudiant', 'Journaliste / Média', 'Banquier / Finance',
  'Ingénieur / Technicien', 'Médecin / Santé', 'Avocat / Juriste', 'Consultant',
  'Artisan', 'Retraité', 'Sans emploi', 'Autre',
];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const STATUTS_FACTURE: Record<string, string> = { cancelled: 'Annulée', refunded: 'Remboursée', draft: 'Brouillon' };

// ─── Classes partagées ───────────────────────────────────────────────────────

const BOUTON =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#111] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#2a2a2d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] disabled:cursor-not-allowed disabled:opacity-50';
const BOUTON_LIGNE =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#d4d4d8] bg-white px-4 text-[14px] font-semibold text-[#111] transition-colors hover:bg-[#f4f4f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] disabled:cursor-not-allowed disabled:opacity-50';
const LIEN =
  'font-semibold text-[#111] underline decoration-1 underline-offset-[3px] hover:text-[#3f4248] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111]';
const CHAMP =
  'w-full min-h-[46px] rounded-lg border border-[#d4d4d8] bg-white px-3.5 text-[16px] text-[#111] placeholder:text-[#8a8e95] focus:border-[#111] focus:outline-none focus:ring-1 focus:ring-[#111]';
const ETIQUETTE = 'mb-1.5 block text-[13px] font-medium text-[#3f4248]';
const TEXTE = 'text-[14px] leading-[1.5] text-[#5f636b]';

// ─── Petits éléments ─────────────────────────────────────────────────────────

function Fiche({ id, titre, action, pied, children }: {
  id: string;
  titre: string;
  action?: React.ReactNode;
  pied?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className="mb-4 scroll-mt-[calc(var(--header-height,64px)+16px)] rounded-md border border-[#e4e4e7] bg-white lg:mb-5"
    >
      <header className="flex items-baseline justify-between gap-3 border-b border-[#ececee] px-[18px] py-[15px] lg:px-6 lg:py-[18px]">
        <h2 id={`${id}-titre`} className="text-[18px] font-bold tracking-[-0.012em] text-[#111]">{titre}</h2>
        {action}
      </header>
      <div className="p-[18px] lg:px-6 lg:py-[22px]">{children}</div>
      {pied && (
        <p className="rounded-b-md border-t border-[#ececee] bg-[#fafafa] px-[18px] py-3 text-[13px] leading-[1.5] text-[#5f636b] lg:px-6">
          {pied}
        </p>
      )}
    </section>
  );
}

function Ligne({ etiquette, valeur, action }: { etiquette: string; valeur: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 border-t border-[#ececee] py-[11px] first:border-t-0 first:pt-0 lg:grid-cols-[170px_1fr_auto] lg:items-baseline lg:gap-x-4">
      <dt className="text-[13px] text-[#5f636b]">{etiquette}</dt>
      <dd className="col-start-1 mt-0.5 break-words text-[15px] font-medium text-[#111] lg:col-start-2 lg:row-start-1 lg:mt-0">{valeur}</dd>
      {action && <div className="col-start-2 row-span-2 row-start-1 self-center lg:col-start-3 lg:row-span-1">{action}</div>}
    </div>
  );
}

/** « Non renseigné », accordé au nom de la ligne (une adresse, une profession : « Non renseignée »). */
function NonRenseigne({ feminin = false }: { feminin?: boolean }) {
  return <span className="font-normal text-[#8a8e95]">{feminin ? 'Non renseignée' : 'Non renseigné'}</span>;
}

/**
 * Coupe un message en phrases, une par ligne : un début de phrase ne reste
 * jamais en bout de ligne. Sans « lookbehind », que Safari ne lit qu'à partir
 * d'iOS 16.4 : une adresse comme contact@nfireport.com ne se coupe pas, son
 * point n'étant pas suivi d'une espace et d'une majuscule.
 */
function phrases(texte: string): string[] {
  const res: string[] = [];
  const fin = /[.!?]\s+(?=[A-ZÀ-ÖØ-Þ])/g;
  let debut = 0;
  for (let m = fin.exec(texte); m; m = fin.exec(texte)) {
    res.push(texte.slice(debut, m.index + 1));
    debut = m.index + m[0].length;
  }
  res.push(texte.slice(debut));
  return res.filter((x) => x.trim());
}

function Message({ reponse }: { reponse: Reponse | null }) {
  if (!reponse) return null;
  return (
    <p
      role={reponse.ok ? 'status' : 'alert'}
      className={`mt-3 rounded-lg border px-3.5 py-2.5 text-[14px] leading-[1.5] ${
        reponse.ok ? 'border-[#d4d4d8] bg-[#f4f4f5] text-[#111]' : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      {phrases(reponse.message).map((phrase, i) => (
        <span key={i} className="block">{phrase}</span>
      ))}
    </p>
  );
}

function Squelette({ lignes = 2 }: { lignes?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="h-5 animate-pulse rounded-sm bg-[#ececee] motion-reduce:animate-none" style={{ width: `${80 - i * 15}%` }} />
      ))}
    </div>
  );
}

// ─── Abonnement ──────────────────────────────────────────────────────────────

function BlocAbonnement({ etat, prixMensuel }: { etat: EtatAbonnement; prixMensuel: number }) {
  if (etat.type === 'admin') {
    return (
      <>
        <p className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111]">Administrateur</p>
        <p className="mt-1 text-[15px] text-[#5f636b]">Accès complet <span className="whitespace-nowrap">au site, sans abonnement.</span></p>
      </>
    );
  }

  if (etat.type === 'lecteur') {
    return (
      <>
        <p className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111]">Lecteur</p>
        <p className="mt-1 text-[15px] text-[#5f636b]">
          {etat.ancienneFin
            ? <>Votre accès Premium a pris fin <span className="whitespace-nowrap">le {etat.ancienneFin}.</span></>
            : 'Lecture sans abonnement'}
        </p>
        <p className="mt-4 text-[15px] leading-[1.5] text-[#1a1a1a]">
          Premium ouvre <span className="whitespace-nowrap">tous les articles,</span>{' '}
          <span className="whitespace-nowrap">la newsletter en intégralité,</span>{' '}
          <span className="whitespace-nowrap">les outils avancés et les cours.</span>
        </p>
        <div className="mt-[18px] flex flex-wrap items-center gap-x-[18px] gap-y-3">
          <Link href="/pricing" className={BOUTON}>{etat.ancienneFin ? 'Reprendre Premium' : 'Passer Premium'}</Link>
          <p className="text-[14px] text-[#5f636b]">Dès <span className="whitespace-nowrap">{montantFcfa(prixMensuel)}</span> par mois</p>
        </div>
      </>
    );
  }

  const jours = etat.jours;
  return (
    <>
      <p className="text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em] text-[#111]">Premium</p>
      <p className="mt-1 text-[15px] text-[#5f636b]">
        {etat.formule}{etat.montant && <>, <span className="whitespace-nowrap">{etat.montant}</span></>}
      </p>
      {etat.fin && (
        <div className="mt-[18px] border-t border-[#ececee] pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[15px]">
            <p className="text-[#111]">Accès jusqu{'’'}au <strong className="whitespace-nowrap font-semibold">{etat.fin}</strong></p>
            {jours !== null && (
              <p className="whitespace-nowrap text-[#5f636b]">
                {jours === 0 ? 'Se termine aujourd’hui' : `${jours}${NB}jour${jours > 1 ? 's' : ''} restant${jours > 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          {etat.partRestante !== null && (
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#e9e9ec]" role="img" aria-label={`${jours ?? 0} jours d’accès restants`}>
              <span className="block h-full rounded-full bg-[#111]" style={{ width: `${Math.round(etat.partRestante * 100)}%` }} />
            </div>
          )}
        </div>
      )}
      {etat.bientotFini && etat.fin ? (
        <>
          <p className="mt-3.5 text-[14px] leading-[1.5] text-[#5f636b]">
            Pour ne perdre aucun jour, renouvelez <span className="whitespace-nowrap">à partir du {etat.fin}.</span>
          </p>
          <div className="mt-[18px]"><Link href="/pricing" className={BOUTON}>Voir les formules</Link></div>
        </>
      ) : (
        <p className="mt-3.5 text-[14px] leading-[1.5] text-[#5f636b]">Aucun renouvellement automatique.</p>
      )}
    </>
  );
}

// ─── Factures ────────────────────────────────────────────────────────────────

function ListeFactures({ factures }: { factures: FactureDuCompte[] | null | undefined }) {
  if (factures === undefined) return <Squelette lignes={2} />;
  if (factures === null) {
    return (
      <>
        <p className="text-[15px] leading-[1.5] text-[#5f636b]">Vos factures n{'’'}ont <span className="whitespace-nowrap">pas pu être chargées.</span></p>
        <p className="text-[15px] leading-[1.5] text-[#5f636b]">Rechargez la page.</p>
      </>
    );
  }
  if (factures.length === 0) return <p className="text-[15px] leading-[1.5] text-[#5f636b]">Aucune facture pour l{'’'}instant.</p>;
  return (
    <ul>
      {factures.map((f) => {
        const date = dateFr(f.paid_at ?? f.created_at);
        const duree = dureeDeFormule(f.billing_cycle);
        const statut = STATUTS_FACTURE[f.status];
        return (
          <li
            key={f.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 border-t border-[#ececee] py-3.5 first:border-t-0 first:pt-0 lg:grid-cols-[150px_minmax(0,1fr)_auto_auto] lg:items-baseline lg:gap-x-5 lg:py-3"
          >
            <p className="text-[15px] font-semibold tabular-nums text-[#111]">{f.invoice_number}</p>
            <p className="col-start-1 text-[14px] text-[#5f636b] lg:col-start-2 lg:row-start-1">
              <span className="whitespace-nowrap">{date}{duree && `, ${duree}`}</span>
            </p>
            {statut && <p className="col-start-1 text-[13px] font-medium text-[#b42318] lg:col-start-2">{statut}</p>}
            <p className="col-start-2 row-start-1 whitespace-nowrap text-right text-[15px] font-semibold tabular-nums text-[#111] lg:col-start-3">{montantFcfa(f.amount_xof)}</p>
            <div className="col-start-2 row-start-2 text-right lg:col-start-4 lg:row-start-1">
              {f.pdf ? (
                <a href={`/api/invoices/${f.id}/download`} className={`${LIEN} inline-flex min-h-[32px] items-center text-[14px]`} aria-label={`Télécharger la facture ${f.invoice_number} en PDF`}>
                  PDF
                </a>
              ) : (
                <span className="whitespace-nowrap text-[13px] text-[#8a8e95]">PDF à venir</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Mes informations ────────────────────────────────────────────────────────

function lectureNaissance(p: ProfilAffiche): string | null {
  if (!p.jourNaissance || !p.moisNaissance || !p.anneeNaissance) return null;
  const jour = p.jourNaissance === '1' ? '1er' : p.jourNaissance;
  return `${jour}${NB}${MOIS[Number(p.moisNaissance) - 1] ?? ''}${NB}${p.anneeNaissance}`;
}

function InformationsLues({ profil }: { profil: ProfilAffiche }) {
  const nom = [profil.prenom, profil.nom].filter(Boolean).join(' ');
  const nomAffiche = nom ? (profil.civilite ? `${profil.civilite}${NB}${nom}` : nom) : '';
  const ville = [profil.codePostal, profil.ville].filter(Boolean).join(' ');
  const adresse = [profil.adresse, ville].filter(Boolean).join(', ');
  const naissance = lectureNaissance(profil);
  return (
    <>
      <dl>
        <Ligne etiquette="Nom" valeur={nomAffiche || <NonRenseigne />} />
        <Ligne etiquette="Profession" valeur={profil.profession || <NonRenseigne feminin />} />
        {naissance && <Ligne etiquette="Date de naissance" valeur={naissance} />}
      </dl>
      <p className="mb-2.5 mt-5 border-t border-[#ececee] pt-4 text-[13px] font-bold text-[#1a1a1a]">Imprimé sur vos factures</p>
      <dl>
        <Ligne etiquette="Téléphone" valeur={profil.telephone ? <span className="whitespace-nowrap">{telephoneLisible(profil.telephone)}</span> : <NonRenseigne />} />
        <Ligne etiquette="Adresse" valeur={adresse ? <span className="block [text-wrap:balance]">{adresse}</span> : <NonRenseigne feminin />} />
        <Ligne etiquette="Pays" valeur={profil.pays || <NonRenseigne />} />
      </dl>
    </>
  );
}

function Champ({ etiquette, valeur, onChange, requis, autoComplete, inputMode }: {
  etiquette: string;
  valeur: string;
  onChange: (v: string) => void;
  requis?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={ETIQUETTE}>
        {etiquette}{requis && <span className="text-[#b42318]" aria-hidden="true">{NB}*</span>}
      </label>
      <input id={id} type="text" value={valeur} onChange={(e) => onChange(e.target.value)} required={requis} autoComplete={autoComplete} inputMode={inputMode} className={CHAMP} />
    </div>
  );
}

/** Une liste déroulante au cadre du site : Safari sur iPhone garde sinon son apparence native, sans cadre. */
function Deroulant({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${CHAMP} appearance-none pr-9 ${className}`} />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5f636b]" aria-hidden="true" />
    </div>
  );
}

function Liste({ etiquette, valeur, onChange, children }: {
  etiquette: string;
  valeur: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={ETIQUETTE}>{etiquette}</label>
      <Deroulant id={id} value={valeur} onChange={(e) => onChange(e.target.value)}>
        {children}
      </Deroulant>
    </div>
  );
}

function FormulaireInformations({ initial, enregistrer, fermer }: {
  initial: ProfilAffiche;
  enregistrer: ActionsCompte['enregistrerProfil'];
  fermer: (reponse: Reponse | null) => void;
}) {
  const [p, setP] = useState<ProfilAffiche>(initial);
  const [enCours, setEnCours] = useState(false);
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const maj = (cle: keyof ProfilAffiche) => (v: string) => setP((x) => ({ ...x, [cle]: v }));
  const annees = Array.from({ length: 90 }, (_, i) => String(new Date().getFullYear() - 13 - i));

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!p.prenom.trim() || !p.nom.trim()) {
      setReponse({ ok: false, message: 'Le prénom et le nom sont obligatoires.' });
      return;
    }
    const erreurTel = validatePhone(p.telephone);
    if (erreurTel) {
      setReponse({ ok: false, message: erreurTel });
      return;
    }
    setEnCours(true);
    setReponse(null);
    const r = await enregistrer(p);
    setEnCours(false);
    if (r.ok) fermer(r);
    else setReponse(r);
  }

  return (
    <form onSubmit={envoyer} noValidate>
      <fieldset>
        <legend className={ETIQUETTE}>Civilité</legend>
        <div className="flex gap-6">
          {(['M.', 'Mme'] as const).map((c) => (
            <label key={c} className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 text-[16px]">
              <input type="radio" name="civilite" value={c} checked={p.civilite === c} onChange={() => setP((x) => ({ ...x, civilite: c }))} className="h-[18px] w-[18px] accent-[#111]" />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Champ etiquette="Prénom" valeur={p.prenom} onChange={maj('prenom')} requis autoComplete="given-name" />
        <Champ etiquette="Nom" valeur={p.nom} onChange={maj('nom')} requis autoComplete="family-name" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Liste etiquette="Profession" valeur={p.profession} onChange={maj('profession')}>
          <option value="">Choisir</option>
          {PROFESSIONS.map((x) => <option key={x} value={x}>{x}</option>)}
        </Liste>
        <fieldset>
          <legend className={ETIQUETTE}>Date de naissance</legend>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-[1fr_1.4fr_1.2fr]">
            <Deroulant aria-label="Jour de naissance" value={p.jourNaissance} onChange={(e) => maj('jourNaissance')(e.target.value)} className="pl-2.5 pr-7">
              <option value="">Jour</option>
              {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1}</option>)}
            </Deroulant>
            <Deroulant aria-label="Mois de naissance" value={p.moisNaissance} onChange={(e) => maj('moisNaissance')(e.target.value)} className="pl-2.5 pr-7">
              <option value="">Mois</option>
              {MOIS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </Deroulant>
            <Deroulant aria-label="Année de naissance" value={p.anneeNaissance} onChange={(e) => maj('anneeNaissance')(e.target.value)} className="pl-2.5 pr-7">
              <option value="">Année</option>
              {annees.map((a) => <option key={a} value={a}>{a}</option>)}
            </Deroulant>
          </div>
        </fieldset>
      </div>

      <p className="mb-3 mt-6 border-t border-[#ececee] pt-4 text-[13px] font-bold text-[#1a1a1a]">Imprimé sur vos factures</p>
      <div className="[&_input]:min-h-[46px] [&_input]:px-3 [&_input]:text-[16px] [&_select]:min-h-[46px] [&_select]:w-[104px] [&_select]:text-[16px] sm:[&_select]:w-[140px]">
        <PhoneField value={p.telephone} onChange={maj('telephone')} />
      </div>
      <div className="mt-4">
        <Champ etiquette="Adresse" valeur={p.adresse} onChange={maj('adresse')} autoComplete="street-address" />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_160px]">
        <Champ etiquette="Ville" valeur={p.ville} onChange={maj('ville')} autoComplete="address-level2" />
        <Champ etiquette="Code postal" valeur={p.codePostal} onChange={maj('codePostal')} autoComplete="postal-code" inputMode="numeric" />
      </div>
      <div className="mt-4">
        <Liste etiquette="Pays" valeur={p.pays} onChange={maj('pays')}>
          <optgroup label={`Afrique de l${'’'}Ouest`}>
            {PAYS_AFRIQUE_OUEST.map((x) => <option key={x} value={x}>{x}</option>)}
          </optgroup>
          <optgroup label="Autres pays">
            {AUTRES_PAYS.map((x) => <option key={x} value={x}>{x}</option>)}
          </optgroup>
        </Liste>
      </div>

      <Message reponse={reponse} />
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={enCours} className={BOUTON}>
          {enCours && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Enregistrer
        </button>
        <button type="button" onClick={() => fermer(null)} disabled={enCours} className={BOUTON_LIGNE}>Annuler</button>
      </div>
    </form>
  );
}

// ─── Mot de passe ────────────────────────────────────────────────────────────

function ChampMotDePasse({ etiquette, valeur, onChange, autoComplete }: {
  etiquette: string;
  valeur: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={ETIQUETTE}>{etiquette}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={valeur}
          onChange={(e) => onChange(e.target.value.slice(0, MOT_DE_PASSE_MAX))}
          autoComplete={autoComplete}
          className={`${CHAMP} pr-[84px]`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1 top-1/2 min-h-[40px] -translate-y-1/2 rounded-md px-3 text-[13px] font-semibold text-[#3f4248] hover:text-[#111] focus-visible:outline-2 focus-visible:outline-[#111]"
          aria-label={visible ? `Masquer le champ ${etiquette.toLowerCase()}` : `Afficher le champ ${etiquette.toLowerCase()}`}
        >
          {visible ? 'Masquer' : 'Afficher'}
        </button>
      </div>
    </div>
  );
}

function FormulaireMotDePasse({ mode, changer, fermer }: {
  /** modifier : l'ancien est demandé ; creer : compte Google ; reinitialiser : lien « mot de passe oublié ». */
  mode: 'modifier' | 'creer' | 'reinitialiser';
  changer: ActionsCompte['changerMotDePasse'];
  fermer: (reponse: Reponse | null) => void;
}) {
  const [actuel, setActuel] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const c = criteresMotDePasse(nouveau);
  const criteres = [
    { ok: c.longueur, texte: '8 caractères ou plus' },
    { ok: c.majuscule, texte: 'une majuscule' },
    { ok: c.chiffre, texte: 'un chiffre' },
    { ok: c.special, texte: 'un caractère spécial' },
  ];

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const erreur = erreurMotDePasse(nouveau);
    if (mode === 'modifier' && !actuel) return setReponse({ ok: false, message: 'Indiquez votre mot de passe actuel.' });
    if (erreur) return setReponse({ ok: false, message: erreur });
    if (nouveau !== confirmation) return setReponse({ ok: false, message: 'Les deux mots de passe ne correspondent pas.' });
    if (mode === 'modifier' && actuel === nouveau) return setReponse({ ok: false, message: 'Le nouveau mot de passe doit être différent de l’ancien.' });
    setEnCours(true);
    setReponse(null);
    const r = await changer({ actuel: mode === 'modifier' ? actuel : null, nouveau });
    setEnCours(false);
    if (r.ok) fermer(r);
    else setReponse(r);
  }

  return (
    <form onSubmit={envoyer} className="mt-4 max-w-[440px] space-y-4" noValidate>
      {mode === 'modifier' && <ChampMotDePasse etiquette="Mot de passe actuel" valeur={actuel} onChange={setActuel} autoComplete="current-password" />}
      <div>
        <ChampMotDePasse etiquette="Nouveau mot de passe" valeur={nouveau} onChange={setNouveau} autoComplete="new-password" />
        <ul className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 text-[13px] min-[360px]:grid-cols-2" aria-label="Critères du mot de passe">
          {criteres.map((k) => (
            <li key={k.texte} className={k.ok ? 'text-[#111]' : 'text-[#6b6f76]'}>
              <span aria-hidden="true">{k.ok ? '✓' : '○'}{NB}</span>{k.texte}
              <span className="sr-only">{k.ok ? `${NB}: respecté` : `${NB}: manquant`}</span>
            </li>
          ))}
        </ul>
      </div>
      <ChampMotDePasse etiquette="Confirmer le nouveau mot de passe" valeur={confirmation} onChange={setConfirmation} autoComplete="new-password" />
      <Message reponse={reponse} />
      {reponse?.reconnexion && (
        <p className={TEXTE}><Link href="/connexion?next=/compte%23securite" className={LIEN}>Se reconnecter</Link></p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={enCours} className={BOUTON}>
          {enCours && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {mode === 'creer' ? 'Créer le mot de passe' : 'Enregistrer'}
        </button>
        {mode !== 'reinitialiser' && <button type="button" onClick={() => fermer(null)} disabled={enCours} className={BOUTON_LIGNE}>Annuler</button>}
      </div>
    </form>
  );
}

// ─── Suppression ─────────────────────────────────────────────────────────────

function FenetreSuppression({ supprimer, fermer }: { supprimer: ActionsCompte['supprimerCompte']; fermer: () => void }) {
  const [texte, setTexte] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const titreId = useId();
  const champId = useId();

  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape' && !enCours) fermer(); };
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [enCours, fermer]);

  async function confirmer() {
    setEnCours(true);
    setReponse(null);
    const r = await supprimer();
    setEnCours(false);
    if (!r.ok) setReponse(r);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !enCours && fermer()} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-labelledby={titreId} className="relative w-full max-w-[440px] rounded-lg bg-white p-6 shadow-xl">
        <h2 id={titreId} className="text-[19px] font-bold tracking-[-0.012em] text-[#b42318]">Supprimer définitivement mon compte</h2>
        <p className={`${TEXTE} mt-3`}>Effacés aussitôt{NB}:</p>
        <ul className={`${TEXTE} mt-1 list-disc pl-5`}>
          <li>votre profil et vos préférences{NB};</li>
          <li>votre abonnement, même payé.</li>
        </ul>
        <p className={`${TEXTE} mt-1`}>Cette action est définitive.</p>
        <label htmlFor={champId} className="mb-1.5 mt-4 block text-[14px] text-[#3f4248]">
          Tapez <strong className="text-[#b42318]">SUPPRIMER</strong> pour confirmer
        </label>
        <input id={champId} value={texte} onChange={(e) => setTexte(e.target.value)} autoComplete="off" autoCapitalize="characters" className={CHAMP} />
        {reponse?.factures ? (
          <div role="alert" className="mt-3 rounded-lg border border-[#d4d4d8] bg-[#f4f4f5] px-3.5 py-3 text-[14px] leading-[1.5] text-[#111]">
            <p>Votre compte a des factures.</p>
            <p>La loi nous oblige <span className="whitespace-nowrap">à les garder dix{NB}ans.</span></p>
            <p className="mt-1.5">Pour supprimer <span className="whitespace-nowrap">votre compte, écrivez-nous{NB}:</span></p>
            <p><a href="mailto:contact@nfireport.com" className={LIEN}>contact@nfireport.com</a></p>
          </div>
        ) : (
          <Message reponse={reponse} />
        )}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={confirmer}
            disabled={texte.trim().toUpperCase() !== 'SUPPRIMER' || enCours}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg bg-[#b42318] px-5 text-[15px] font-semibold text-white hover:bg-[#931d14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b42318] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {enCours && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Supprimer définitivement
          </button>
          <button type="button" onClick={fermer} disabled={enCours} className={BOUTON_LIGNE}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

// ─── La page ─────────────────────────────────────────────────────────────────

export function CompteVue({ donnees, actions }: { donnees: DonneesCompte; actions: ActionsCompte }) {
  const { abonnement, profil, connexion, newsletter } = donnees;
  const [rubriqueActive, setRubriqueActive] = useState<string>('abonnement');
  const [editionInfos, setEditionInfos] = useState(false);
  const [reponseInfos, setReponseInfos] = useState<Reponse | null>(null);
  const [motDePasse, setMotDePasse] = useState<'ferme' | 'ouvert'>(donnees.reinitialisation ? 'ouvert' : 'ferme');
  const [reponseMotDePasse, setReponseMotDePasse] = useState<Reponse | null>(null);
  const [partout, setPartout] = useState<'repos' | 'confirmer' | 'en-cours'>('repos');
  const [reponsePartout, setReponsePartout] = useState<Reponse | null>(null);
  const [suppression, setSuppression] = useState(false);
  const [newsletterEnCours, setNewsletterEnCours] = useState(false);
  const [reponseNewsletter, setReponseNewsletter] = useState<Reponse | null>(null);
  const [etatNewsletter, setEtatNewsletter] = useState(newsletter);

  useEffect(() => { setEtatNewsletter(newsletter); }, [newsletter]);

  // Le sommaire suit la rubrique lue (ordinateur, où il reste à l'écran).
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observateur = new IntersectionObserver(
      (entrees) => {
        const visible = entrees.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setRubriqueActive(visible.target.id);
      },
      { rootMargin: '-25% 0px -65% 0px' },
    );
    RUBRIQUES.forEach((r) => { const el = document.getElementById(r.id); if (el) observateur.observe(el); });
    return () => observateur.disconnect();
  }, []);

  // Arrivée par le lien « mot de passe oublié » : on va droit au formulaire.
  useEffect(() => {
    if (donnees.reinitialisation) document.getElementById('securite')?.scrollIntoView();
  }, [donnees.reinitialisation]);

  const modeMotDePasse: 'modifier' | 'creer' | 'reinitialiser' = donnees.reinitialisation
    ? 'reinitialiser'
    : connexion && !connexion.motDePasse ? 'creer' : 'modifier';

  async function basculerNewsletter() {
    if (!etatNewsletter || newsletterEnCours) return;
    setNewsletterEnCours(true);
    setReponseNewsletter(null);
    const voulu = !etatNewsletter.recoit;
    const r = await actions.changerNewsletter(voulu);
    setNewsletterEnCours(false);
    if (r.etat) setEtatNewsletter(r.etat);
    if (!r.ok) setReponseNewsletter(r);
    else if (r.etat && voulu && !r.etat.recoit) {
      setReponseNewsletter({ ok: false, message: 'L’envoi vers cette adresse ne peut pas être rétabli d’ici. Écrivez-nous à contact@nfireport.com.' });
    }
  }

  async function seDeconnecterPartout() {
    setPartout('en-cours');
    const r = await actions.deconnexionPartout();
    if (!r.ok) { setPartout('repos'); setReponsePartout(r); }
  }

  return (
    <div className="min-h-screen bg-[#f2f2f3]">
      {/* Bandeau : la salutation, en deux tons comme les titres du site. */}
      <section className="bg-[#111] text-white">
        <div className="mx-auto max-w-[1200px] px-5 pb-[30px] pt-[26px] lg:px-8 lg:pb-[46px] lg:pt-11">
          <p className="text-[13px] font-semibold text-[#a9adb4]">Mon compte</p>
          <h1 className="mt-2.5 break-words text-[30px] font-extrabold leading-[1.08] tracking-[-0.035em] lg:text-[44px]">
            {donnees.salutation} <span data-deux-tons className="whitespace-nowrap text-[#7d8189]">voici votre{NB}compte.</span>
          </h1>
          <p className="mt-3.5 break-all text-[14px] leading-[1.5] text-[#a9adb4]">{donnees.email}</p>
          {donnees.membreDepuis && (
            <p className="text-[14px] leading-[1.5] text-[#a9adb4]">Membre depuis le <span className="whitespace-nowrap">{donnees.membreDepuis}</span></p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-3.5 pb-9 pt-4 lg:grid lg:grid-cols-[200px_minmax(0,860px)] lg:items-start lg:gap-14 lg:px-8 lg:pb-14 lg:pt-8">
        <nav
          aria-label="Rubriques du compte"
          className="mb-4 grid grid-cols-2 overflow-hidden rounded-md border border-[#e4e4e7] bg-white lg:sticky lg:top-[calc(var(--header-height,64px)+24px)] lg:mb-0 lg:block lg:overflow-visible lg:rounded-none lg:border-0 lg:bg-transparent"
        >
          {RUBRIQUES.map((r, i) => {
            const active = rubriqueActive === r.id;
            return (
              <a
                key={r.id}
                href={`#${r.id}`}
                aria-current={active ? 'location' : undefined}
                className={`flex min-h-[46px] items-center px-3.5 text-[14px] text-[#111] hover:bg-[#f7f7f8] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#111] lg:min-h-[40px] lg:border-0 lg:pl-3.5 lg:hover:bg-transparent lg:hover:underline ${
                  i >= 2 ? 'border-t border-[#ececee]' : ''
                } ${i % 2 === 0 ? 'border-r border-[#ececee]' : ''} ${
                  active ? 'font-medium lg:font-semibold lg:shadow-[inset_2px_0_0_#111]' : 'font-medium lg:shadow-[inset_1px_0_0_#d9d9de]'
                }`}
              >
                {r.court}
              </a>
            );
          })}
          <button
            type="button"
            onClick={actions.deconnexion}
            className="flex min-h-[46px] items-center border-t border-[#ececee] px-3.5 text-left text-[14px] font-medium text-[#5f636b] hover:text-[#111] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#111] lg:mt-4 lg:min-h-[40px] lg:border-0 lg:px-0"
          >
            Se déconnecter
          </button>
        </nav>

        <main className="min-w-0">
          <Fiche id="abonnement" titre="Abonnement">
            <BlocAbonnement etat={abonnement} prixMensuel={donnees.prixMensuel} />
          </Fiche>

          <Fiche id="factures" titre="Factures" pied={<>Vos factures restent ici, <span className="whitespace-nowrap">même après la fin de votre accès.</span></>}>
            <ListeFactures factures={donnees.factures} />
          </Fiche>

          <Fiche
            id="informations"
            titre="Mes informations"
            action={!editionInfos && (
              <button type="button" onClick={() => { setEditionInfos(true); setReponseInfos(null); }} className={`${LIEN} min-h-[32px] text-[14px]`}>
                Modifier
              </button>
            )}
          >
            {editionInfos
              ? <FormulaireInformations initial={profil} enregistrer={actions.enregistrerProfil} fermer={(r) => { setEditionInfos(false); setReponseInfos(r); }} />
              : <InformationsLues profil={profil} />}
            {!editionInfos && <Message reponse={reponseInfos} />}
          </Fiche>

          <Fiche id="securite" titre="Connexion et sécurité">
            <dl>
              <Ligne
                etiquette="Adresse e-mail"
                valeur={
                  <>
                    <span className="break-all">{donnees.email}</span>
                    <span className="mt-0.5 block text-[13px] font-normal text-[#5f636b]">
                      Pour la changer, <Link href="/contact" className={LIEN}>écrivez-nous</Link>.
                    </span>
                  </>
                }
              />
              <Ligne
                etiquette="Mot de passe"
                valeur={connexion === undefined
                  ? <span className="font-normal text-[#8a8e95]">…</span>
                  : connexion.motDePasse || donnees.reinitialisation ? '••••••••••' : <span className="font-normal">Connexion avec Google</span>}
                action={motDePasse === 'ferme' && connexion !== undefined && (
                  <button
                    type="button"
                    onClick={() => { setMotDePasse('ouvert'); setReponseMotDePasse(null); }}
                    className={`${LIEN} min-h-[32px] text-[14px]`}
                  >
                    {modeMotDePasse === 'creer' ? 'Créer' : 'Modifier'}
                  </button>
                )}
              />
            </dl>
            {motDePasse === 'ouvert' && (
              <>
                {modeMotDePasse === 'creer' && (
                  <p className={`${TEXTE} mt-3`}>Créez un mot de passe <span className="whitespace-nowrap">pour vous connecter aussi par e-mail.</span></p>
                )}
                <FormulaireMotDePasse mode={modeMotDePasse} changer={actions.changerMotDePasse} fermer={(r) => { setMotDePasse('ferme'); setReponseMotDePasse(r); }} />
              </>
            )}
            {motDePasse === 'ferme' && <Message reponse={reponseMotDePasse} />}

            <div className="mt-[18px] border-t border-[#ececee] pt-4">
              <p className="text-[15px] font-semibold text-[#111]">Appareils</p>
              <p className={`${TEXTE} mt-0.5`}>Téléphone perdu ou ordinateur prêté{NB}: fermez toutes <span className="whitespace-nowrap">vos sessions d{'’'}un coup.</span></p>
              <div className="mt-3.5 flex flex-wrap gap-3">
                {partout === 'repos' ? (
                  <button type="button" onClick={() => setPartout('confirmer')} className={BOUTON_LIGNE}>Se déconnecter partout</button>
                ) : (
                  <>
                    <button type="button" onClick={seDeconnecterPartout} disabled={partout === 'en-cours'} className={BOUTON}>
                      {partout === 'en-cours' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}Oui, partout
                    </button>
                    <button type="button" onClick={() => setPartout('repos')} disabled={partout === 'en-cours'} className={BOUTON_LIGNE}>Annuler</button>
                  </>
                )}
              </div>
              <Message reponse={reponsePartout} />
            </div>

            <div className="mt-[18px] border-t border-[#ececee] pt-4">
              <p className="text-[15px] font-semibold text-[#111]">Supprimer mon compte</p>
              {donnees.role === 'admin' ? (
                <>
                  <p className={`${TEXTE} mt-0.5`}>Ce compte est administrateur.</p>
                  <p className={TEXTE}>Il ne se supprime pas d{'’'}ici.</p>
                </>
              ) : (
                <>
                  <p className={`${TEXTE} mt-0.5`}>Votre profil <span className="whitespace-nowrap">et vos préférences sont effacés.</span></p>
                  <p className={TEXTE}>Vos factures sont gardées dix{NB}ans, <span className="whitespace-nowrap">comme la loi l{'’'}exige.</span></p>
                  <button type="button" onClick={() => setSuppression(true)} className="mt-2 min-h-[32px] text-[14px] font-semibold text-[#b42318] underline decoration-1 underline-offset-[3px] hover:text-[#931d14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b42318]">
                    Supprimer mon compte
                  </button>
                </>
              )}
            </div>
          </Fiche>

          <Fiche id="newsletter" titre="Newsletter">
            {etatNewsletter === undefined ? (
              <Squelette lignes={2} />
            ) : etatNewsletter === null ? (
              donnees.erreurChargement
                ? <><p className={TEXTE}>La newsletter n{'’'}a <span className="whitespace-nowrap">pas pu être chargée.</span></p><p className={TEXTE}>Rechargez la page.</p></>
                : <p className={TEXTE}>Confirmez d{'’'}abord votre adresse e-mail <span className="whitespace-nowrap">pour gérer la newsletter.</span></p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <p id="newsletter-libelle" className="text-[15px] font-semibold text-[#111]">Recevoir la newsletter</p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={etatNewsletter.recoit}
                    aria-labelledby="newsletter-libelle"
                    onClick={basculerNewsletter}
                    disabled={newsletterEnCours}
                    className="relative inline-flex min-h-[44px] min-w-[52px] shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111] disabled:opacity-60"
                  >
                    <span className={`relative block h-7 w-[46px] rounded-full transition-colors ${etatNewsletter.recoit ? 'bg-[#111]' : 'bg-[#c9c9ce]'}`}>
                      <span className={`absolute left-0 top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${etatNewsletter.recoit ? 'translate-x-[21px]' : 'translate-x-[3px]'}`} />
                    </span>
                  </button>
                </div>
                {etatNewsletter.bloquee ? (
                  <>
                    <p className={`${TEXTE} mt-1`}>Les envois vers <span className="whitespace-nowrap">cette adresse sont arrêtés.</span></p>
                    <p className={TEXTE}><span className="whitespace-nowrap">Pour les rétablir, <Link href="/contact" className={LIEN}>écrivez-nous</Link>.</span></p>
                  </>
                ) : etatNewsletter.recoit ? (
                  <>
                    <p className={`${TEXTE} mt-1`}>Elle arrive à l{'’'}adresse <span className="whitespace-nowrap">de votre compte.</span></p>
                    <p className={TEXTE}>Vous pouvez <span className="whitespace-nowrap">l{'’'}arrêter ici à tout moment.</span></p>
                  </>
                ) : (
                  <p className={`${TEXTE} mt-1`}>Activez-la pour la recevoir <span className="whitespace-nowrap">par e-mail.</span></p>
                )}
                {newsletterEnCours && <p className={`${TEXTE} mt-2`} role="status">Enregistrement{'…'}</p>}
                <Message reponse={reponseNewsletter} />
              </>
            )}
          </Fiche>

          <p className="mx-1 mt-1.5 text-[14px] leading-[1.5] text-[#5f636b]">Une question sur votre compte{FINE}?</p>
          <p className="mx-1 text-[14px] leading-[1.5] text-[#5f636b]">Écrivez à <a href="mailto:contact@nfireport.com" className={LIEN}>contact@nfireport.com</a></p>
        </main>
      </div>

      {suppression && <FenetreSuppression supprimer={actions.supprimerCompte} fermer={() => setSuppression(false)} />}
    </div>
  );
}
