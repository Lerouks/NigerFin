import { describe, expect, it } from 'vitest';
import {
  connexionDuCompte,
  dateFr,
  etatAbonnement,
  joursRestants,
  montantFcfa,
  nomComplet,
  salutation,
  telephoneLisible,
} from '@/lib/compte';
import { erreurMotDePasse } from '@/lib/mot-de-passe';

const FINE = '\u202F';
const NB = '\u00A0';
const JOUR = 86_400_000;
const MAINTENANT = Date.parse('2026-11-24T12:00:00Z');

describe('« Mon compte » : montants et dates à la française', () => {
  it('un montant garde ses milliers et sa devise ensemble', () => {
    expect(montantFcfa(50_000)).toBe(`50${FINE}000${NB}FCFA`);
    expect(montantFcfa(5_000)).toBe(`5${FINE}000${NB}FCFA`);
    expect(montantFcfa(13_750)).toBe(`13${FINE}750${NB}FCFA`);
    expect(montantFcfa(950)).toBe(`950${NB}FCFA`);
  });

  it('une date ne se coupe pas, et le premier du mois s’écrit « 1er »', () => {
    expect(dateFr('2027-03-10T12:00:00Z')).toBe(`10${NB}mars${NB}2027`);
    expect(dateFr('2026-12-01T12:00:00Z')).toBe(`1er${NB}décembre${NB}2026`);
    expect(dateFr(null)).toBeNull();
    expect(dateFr('pas une date')).toBeNull();
  });

  it('la date se lit à l’heure de Niamey, pas à celle de l’appareil', () => {
    // 23 h 30 UTC le 31 décembre : déjà le 1er janvier à Niamey (UTC+1).
    expect(dateFr('2026-12-31T23:30:00Z')).toBe(`1er${NB}janvier${NB}2027`);
  });

  it('les jours restants s’arrondissent au jour suivant, et zéro une fois la date passée', () => {
    expect(joursRestants(new Date(MAINTENANT + 106 * JOUR).toISOString(), MAINTENANT)).toBe(106);
    expect(joursRestants(new Date(MAINTENANT + 1).toISOString(), MAINTENANT)).toBe(1);
    expect(joursRestants(new Date(MAINTENANT - JOUR).toISOString(), MAINTENANT)).toBe(0);
    expect(joursRestants(null, MAINTENANT)).toBeNull();
  });
});

describe('« Mon compte » : l’état de l’abonnement', () => {
  const finDans = (jours: number) => new Date(MAINTENANT + jours * JOUR).toISOString();

  it('un administrateur n’a pas d’abonnement à afficher', () => {
    expect(etatAbonnement({ role: 'admin', abonnement: null, profil: null, maintenant: MAINTENANT })).toEqual({ type: 'admin' });
  });

  it('Premium : formule, montant, fin et part du temps restant', () => {
    const etat = etatAbonnement({
      role: 'premium',
      abonnement: {
        status: 'active',
        billing_cycle: 'yearly',
        current_period_start: finDans(-259),
        current_period_end: finDans(106),
        price_amount: 50_000,
      },
      profil: null,
      maintenant: MAINTENANT,
    });
    expect(etat).toMatchObject({ type: 'premium', formule: 'Formule annuelle', montant: `50${FINE}000${NB}FCFA`, jours: 106, bientotFini: false });
    if (etat.type !== 'premium') throw new Error('Premium attendu');
    expect(etat.partRestante).toBeCloseTo(106 / 365, 2);
  });

  it('Premium à sept jours de la fin : on conseille de renouveler sans perdre de jour', () => {
    const etat = etatAbonnement({
      role: 'premium',
      abonnement: null,
      profil: { subscription_end: finDans(7), billing_cycle: 'monthly' },
      maintenant: MAINTENANT,
    });
    expect(etat).toMatchObject({ type: 'premium', formule: 'Formule mensuelle', montant: null, jours: 7, bientotFini: true, partRestante: null });
  });

  it('Premium accordé sans paiement : pas de montant affiché', () => {
    const etat = etatAbonnement({
      role: 'premium',
      abonnement: { status: 'active', billing_cycle: 'yearly', current_period_start: null, current_period_end: finDans(30), price_amount: 0 },
      profil: null,
      maintenant: MAINTENANT,
    });
    expect(etat).toMatchObject({ type: 'premium', montant: null });
  });

  it('un ancien abonné redevenu lecteur voit la date de fin de son accès', () => {
    const etat = etatAbonnement({
      role: 'reader',
      abonnement: { status: 'expired', billing_cycle: 'monthly', current_period_start: null, current_period_end: '2026-10-05T10:00:00Z', price_amount: 5_000 },
      profil: null,
      maintenant: MAINTENANT,
    });
    expect(etat).toEqual({ type: 'lecteur', ancienneFin: `5${NB}octobre${NB}2026` });
  });

  it('un lecteur sans abonnement', () => {
    expect(etatAbonnement({ role: 'reader', abonnement: null, profil: null, maintenant: MAINTENANT })).toEqual({ type: 'lecteur', ancienneFin: null });
  });
});

describe('« Mon compte » : le téléphone', () => {
  it('un numéro du Niger se lit par paires, soudées', () => {
    expect(telephoneLisible('+22790123456')).toBe(['+227', '90', '12', '34', '56'].join(NB));
    expect(telephoneLisible('+227 90 12 34 56')).toBe(['+227', '90', '12', '34', '56'].join(NB));
  });

  it('un numéro d’un autre pays se lit comme on l’écrit là-bas', () => {
    expect(telephoneLisible('+33612345678')).toBe(['+33', '6', '12', '34', '56', '78'].join(NB));
  });

  it('un numéro illisible reste tel qu’il a été saisi', () => {
    expect(telephoneLisible('+2271234')).toBe('+2271234');
  });
});

describe('« Mon compte » : la salutation et le nom', () => {
  it('civilité et nom soudés, sinon le prénom, sinon un simple bonjour', () => {
    expect(salutation({ civility: 'M.', first_name: 'Raouf', last_name: 'Barkiré' })).toBe(`Bonjour M.${NB}Barkiré,`);
    expect(salutation({ civility: null, first_name: 'Aïcha', last_name: 'Issa' })).toBe('Bonjour Aïcha,');
    expect(salutation({ civility: null, first_name: '', last_name: 'Issa' })).toBe('Bonjour Issa,');
    expect(salutation(null)).toBe('Bonjour,');
  });

  it('le nom complet porte la civilité', () => {
    expect(nomComplet({ civility: 'Mme', first_name: 'Aïcha', last_name: 'Issa' })).toBe(`Mme${NB}Aïcha Issa`);
    expect(nomComplet({ first_name: '', last_name: '' })).toBeNull();
  });
});

describe('« Mon compte » : la façon de se connecter', () => {
  it('inscription par e-mail : un mot de passe existe', () => {
    expect(connexionDuCompte({ identities: [{ provider: 'email' }] as never, app_metadata: {} })).toEqual({ motDePasse: true, google: false });
  });

  it('compte Google : pas de mot de passe, tant qu’il n’en a pas créé un', () => {
    expect(connexionDuCompte({ identities: [{ provider: 'google' }] as never, app_metadata: {} })).toEqual({ motDePasse: false, google: true });
    expect(connexionDuCompte({ identities: [{ provider: 'google' }] as never, app_metadata: { mot_de_passe_cree: true } }))
      .toEqual({ motDePasse: true, google: true });
  });
});

describe('les règles du mot de passe', () => {
  it('8 caractères suffisent, sans majuscule, chiffre ni caractère spécial (NIST SP 800-63B)', () => {
    expect(erreurMotDePasse('fleuve du niger')).toBeNull();
    expect(erreurMotDePasse('tamarinier')).toBeNull();
    expect(erreurMotDePasse('Niamey-2026')).toBeNull();
  });

  it('trop court ou trop long : la phrase dit la limite', () => {
    expect(erreurMotDePasse('Ni-1')).toMatch(/au moins 8/);
    expect(erreurMotDePasse('x'.repeat(129))).toMatch(/dépasser 128/);
  });

  it('les mots de passe courants, les suites et les répétitions sont refusés', () => {
    for (const mot of ['password', '12345678', 'azertyuiop', 'motdepasse', 'Niger2026', 'aaaaaaaa', 'abababab', '87654321']) {
      expect(erreurMotDePasse(mot), mot).toMatch(/trop facile/);
    }
  });

  it('ni l’adresse e-mail ni le nom de la personne', () => {
    expect(erreurMotDePasse('aissatou.ali@exemple.ne', { email: 'aissatou.ali@exemple.ne' })).toMatch(/adresse e-mail/);
    expect(erreurMotDePasse('aissatou2026', { email: 'aissatou@exemple.ne' })).toMatch(/adresse e-mail/);
    expect(erreurMotDePasse('Moussa123', { prenom: 'Abdoul', nom: 'Moussa' })).toMatch(/votre nom/);
  });
});
