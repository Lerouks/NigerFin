import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BandeauAnnonce, EnTeteCorbeille, LigneCorbeille, NoteTotal, type EntreeCorbeille } from '@/app/admin/CorbeilleManager';

/**
 * Ce que l'écran de la corbeille affirme. Une phrase fausse sur cet écran
 * coûte cher : la première version promettait que les commentaires modérés
 * étaient supprimés définitivement, alors que la corbeille les faisait revenir.
 */

/** Le texte lu, balises retirées, insécables ramenées à des espaces. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/\u2011/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

const ENTREE: EntreeCorbeille = {
  id: '00000000-0000-4000-8000-000000000900',
  table_origine: 'education_categories',
  id_origine: '00000000-0000-4000-8000-000000000100',
  titre: 'Bourse',
  supprime_le: '2026-11-03T10:00:00.000Z',
  resume_dependants: { education_lessons: 3, user_lesson_progress: 12 },
};

const sansAction = () => undefined;

function ligne(confirmation: boolean): string {
  return renderToStaticMarkup(
    <ul>
      <LigneCorbeille
        entree={ENTREE}
        enCours={false}
        confirmation={confirmation}
        onRestaurer={sansAction}
        onDemanderSuppression={sansAction}
        onConfirmerSuppression={sansAction}
        onAnnuler={sansAction}
      />
    </ul>,
  );
}

describe('écran de la corbeille', () => {
  it('l’en-tête dit la durée, ce que deviennent les commentaires, et ce qui ne passe pas par la corbeille', () => {
    const lu = texte(renderToStaticMarkup(<EnTeteCorbeille />));
    expect(lu).toContain('Ils y restent 30 jours, puis sont supprimés définitivement.');
    expect(lu).toContain('Les commentaires et les j’aime d’un article ne partent pas avec lui');
    expect(lu).toContain('« Article supprimé »');
    expect(lu).toContain('jamais à moitié');
    expect(lu).toContain('Ne passent pas par la corbeille');
  });

  it('une entrée montre son type, sa date, ce qui l’accompagne, sa fin de conservation et deux actions, sans état « à moitié »', () => {
    const lu = texte(ligne(false));
    expect(lu).toContain('Catégorie de leçons');
    expect(lu).toContain('dans la corbeille depuis le 3 novembre 2026');
    expect(lu).toContain('Avec 3 leçons et 12 progressions de lecteurs');
    expect(lu).toContain('Récupérable jusqu’au 3 décembre 2026');
    expect(lu).toContain('Remettre en place');
    expect(lu).toContain('Supprimer définitivement');
    expect(lu).not.toMatch(/incomplète|Terminer la restauration|Abandonner/);
  });

  it('les entrées se mettent en ligne d’après la largeur de la liste, pas celle de l’écran', () => {
    const html = ligne(false);
    expect(html).toContain('@3xl:flex-row');
    expect(html).not.toMatch(/\bmd:flex-row/);
  });

  it('la confirmation de suppression définitive dit exactement ce qui disparaît', () => {
    const lu = texte(ligne(true));
    expect(lu).toContain('Définitif : « Bourse » disparaîtra avec 3 leçons et 12 progressions de lecteurs, sans retour possible.');
    expect(lu).toContain('Annuler');
  });

  it('les annonces et la note de liste tronquée posent la typographie française', () => {
    const html = renderToStaticMarkup(<BandeauAnnonce annonce={{ ton: 'succes', texte: '« Bourse » est de nouveau en place.', remarques: ['Une remarque : la voici.'] }} />);
    expect(html).toContain('\u202fBourse\u202f');
    expect(html).toContain('remarque\u00a0:');
    expect(texte(renderToStaticMarkup(<NoteTotal affichees={200} total={1450} />))).toBe('Les 200 suppressions les plus récentes sur 1 450.');
    expect(renderToStaticMarkup(<NoteTotal affichees={3} total={3} />)).toBe('');
  });
});
