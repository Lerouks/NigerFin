import { describe, expect, it } from 'vitest';
import { erreurNom, estCivilite, estTrancheAge, libelleTrancheAge, normaliserNom, professionConnue, TRANCHES_AGE } from '@/lib/regles-du-compte';
import { decomposerTelephone, erreurTelephone, telephoneE164 } from '@/lib/telephone';
import { AUTRES_PAYS, nomDePays, PAYS_AFRIQUE_OUEST, TOUS_LES_PAYS } from '@/lib/pays';
import { lienDeConfirmation } from '@/lib/auth-context';

/**
 * Les règles de l'inscription et de « Mon compte », décidées par Raouf le 26 et
 * le 27/11/2026 : civilité obligatoire, prénom et nom de 2 à 50 caractères en
 * lettres latines (accents, haoussa et peul compris), tranche d'âge de Meta,
 * téléphone valable pour son pays, pays de l'Afrique de l'Ouest en tête.
 */

describe('le prénom et le nom', () => {
  it('acceptent les noms de chez nous, accents et apostrophe de l’iPhone compris', () => {
    for (const nom of ['Abdoul Aziz', 'Moussa', 'Ba', 'N’Diaye', "N'Diaye", 'Jean-Pierre', 'Aïssatou', 'Ɓello', 'Ɗan Ƙyari', 'Mamadou El Hadj', 'Ƴaro']) {
      expect(erreurNom(nom, 'Le nom'), nom).toBeNull();
    }
  });

  it('sont obligatoires et font de 2 à 50 caractères', () => {
    expect(erreurNom('', 'Le prénom')).toMatch(/obligatoire/);
    expect(erreurNom('   ', 'Le prénom')).toMatch(/obligatoire/);
    expect(erreurNom('A', 'Le prénom')).toMatch(/au moins 2/);
    expect(erreurNom('A'.repeat(51), 'Le nom')).toMatch(/dépasser 50/);
    expect(erreurNom('A'.repeat(50), 'Le nom')).toBeNull();
  });

  it('refusent le point, les chiffres, les symboles et les autres alphabets', () => {
    for (const nom of ['Moussa A.', 'Moussa2', 'R@ouf', 'محمد', '李小龙', 'Ali--Ba', '-Ali', "Ali'", 'Ali  Ba!']) {
      expect(erreurNom(nom, 'Le nom'), nom).toMatch(/que des lettres/);
    }
  });

  it('s’enregistrent sans espaces en trop, accents composés', () => {
    expect(normaliserNom('  Abdoul   Aziz ')).toBe('Abdoul Aziz');
    expect(normaliserNom('Aïssatou'.normalize('NFD'))).toBe('Aïssatou');
  });
});

describe('la civilité et la tranche d’âge', () => {
  it('civilité : M. ou Mme, rien d’autre', () => {
    expect(estCivilite('M.')).toBe(true);
    expect(estCivilite('Mme')).toBe(true);
    expect(estCivilite('Mlle')).toBe(false);
    expect(estCivilite('')).toBe(false);
  });

  it('tranches de Meta, et rien d’autre', () => {
    expect(TRANCHES_AGE.map((t) => t.valeur)).toEqual(['moins-18', '18-24', '25-34', '35-44', '45-54', '55-64', '65-plus']);
    expect(estTrancheAge('25-34')).toBe(true);
    expect(estTrancheAge('30-40')).toBe(false);
    expect(libelleTrancheAge('65-plus')).toBe('65 ans et plus');
    expect(libelleTrancheAge(null)).toBeNull();
  });

  it('une profession saisie avec une apostrophe droite est reconnue', () => {
    expect(professionConnue("Cadre d'entreprise")).toBe('Cadre d’entreprise');
    expect(professionConnue('Astronaute')).toBeNull();
  });
});

describe('le téléphone', () => {
  it('Niger : 8 chiffres', () => {
    expect(telephoneE164('+22790123456')).toBe('+22790123456');
    expect(telephoneE164('90 12 34 56', 'NE')).toBe('+22790123456');
    expect(erreurTelephone('+2279012345')).toMatch(/pas valable/);
  });

  it('Bénin : 10 chiffres depuis le 30/11/2024, l’ancien format est refusé', () => {
    expect(telephoneE164('+2290197123456')).toBe('+2290197123456');
    expect(erreurTelephone('+22997123456')).toMatch(/pas valable/);
  });

  it('facultatif : vide, il passe', () => {
    expect(erreurTelephone('')).toBeNull();
    expect(erreurTelephone(null)).toBeNull();
  });

  it('un numéro enregistré se relit dans son pays', () => {
    expect(decomposerTelephone('+22370123456')).toEqual({ pays: 'ML', national: '70123456' });
    expect(decomposerTelephone('')).toEqual({ pays: 'NE', national: '' });
  });
});

describe('les pays', () => {
  it('le Niger, le Mali, le Burkina Faso et la Côte d’Ivoire d’abord, puis le reste de l’Afrique de l’Ouest', () => {
    expect(PAYS_AFRIQUE_OUEST.slice(0, 4).map((p) => p.nom)).toEqual(['Niger', 'Mali', 'Burkina Faso', 'Côte d’Ivoire']);
    expect(PAYS_AFRIQUE_OUEST.map((p) => p.nom)).toContain('Nigeria');
    expect(AUTRES_PAYS.map((p) => p.nom)).toContain('France');
  });

  it('chaque pays a un code ISO unique', () => {
    const codes = TOUS_LES_PAYS.map((p) => p.iso);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('une ancienne saisie à l’apostrophe droite retrouve le nom de la liste', () => {
    expect(nomDePays("Côte d'Ivoire")).toBe('Côte d’Ivoire');
    expect(nomDePays('Brésil')).toBe('Brésil');
  });
});

describe('le lien du mail de confirmation', () => {
  it('passe par le retour de connexion, puis l’écran de bienvenue, puis la page de départ', () => {
    const lien = new URL(lienDeConfirmation('https://nfireport.com', '/paiement?tier=premium&cycle=yearly'));
    expect(lien.pathname).toBe('/api/auth/callback');
    expect(lien.searchParams.get('next')).toBe('/inscription/bienvenue?suite=%2Fpaiement%3Ftier%3Dpremium%26cycle%3Dyearly');
  });

  it('sans page de départ : l’écran de bienvenue seul', () => {
    const lien = new URL(lienDeConfirmation('https://nfireport.com'));
    expect(lien.searchParams.get('next')).toBe('/inscription/bienvenue');
  });
});
