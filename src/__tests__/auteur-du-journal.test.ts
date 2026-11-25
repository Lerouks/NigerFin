import { describe, expect, it } from 'vitest';
import { auteurDeLaLigne, nomDansLeFil } from '@/app/admin/lib/auteur-du-journal';

describe('auteurDeLaLigne : la colonne « Auteur » du journal', () => {
  it('une action du système affiche « Système »', () => {
    expect(auteurDeLaLigne({ admin_id: null, par_le_systeme: true, user_profiles: null })).toBe('Système');
  });

  it('une action d’admin affiche son adresse', () => {
    expect(auteurDeLaLigne({
      admin_id: '11111111-1111-4111-8111-111111111111',
      par_le_systeme: false,
      user_profiles: { email: 'admin@exemple.test', full_name: 'Admin' },
    })).toBe('admin@exemple.test');
  });

  it('un auteur sans profil lisible : le début de son identifiant', () => {
    expect(auteurDeLaLigne({ admin_id: '11111111-1111-4111-8111-111111111111', user_profiles: null })).toBe('11111111…');
  });

  it('un compte supprimé depuis (auteur vidé par la base) ne passe pas pour le système', () => {
    expect(auteurDeLaLigne({ admin_id: null, par_le_systeme: false, user_profiles: null })).toBe('Compte supprimé');
  });
});

describe('nomDansLeFil : le fil d’activité du module Site', () => {
  it('une ligne sans auteur ne fait plus planter la page', () => {
    expect(nomDansLeFil({ admin_id: null, par_le_systeme: true })).toBe('Système');
    expect(nomDansLeFil({ admin_id: null, par_le_systeme: false, user_profiles: null })).toBe('Compte supprimé');
  });

  it('le nom complet passe avant l’adresse, et l’adresse avant l’identifiant', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    expect(nomDansLeFil({ admin_id: id, user_profiles: { email: 'redaction@exemple.test', full_name: 'Aïcha Moussa' } })).toBe('Aïcha Moussa');
    expect(nomDansLeFil({ admin_id: id, user_profiles: { email: 'redaction@exemple.test', full_name: '' } })).toBe('redaction@exemple.test');
    expect(nomDansLeFil({ admin_id: id, user_profiles: null })).toBe('11111111…');
  });
});
