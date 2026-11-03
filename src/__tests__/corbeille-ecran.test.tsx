import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  BandeauAnnonce,
  EnTeteCorbeille,
  LigneCorbeille,
  NoteTotal,
  SuiteDeLaListe,
  type EntreeCorbeille,
} from '@/app/admin/CorbeilleManager';

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
    expect(lu).toContain('Ils y restent 30 jours, jusqu’à la date affichée incluse (heure de Niamey), puis sont supprimés définitivement.');
    expect(lu).toContain('Les commentaires et les j’aime d’un article restent en place tant qu’il est ici');
    expect(lu).toContain('« Article supprimé »');
    expect(lu).toContain('Supprimé définitivement, ou au bout du délai, il les emporte avec lui.');
    expect(lu).toContain('jamais à moitié');
    expect(lu).toContain('Ne passent pas par la corbeille');
  });

  it('une entrée montre son type, sa date, ce qui l’accompagne, sa fin de conservation et deux actions, sans état « à moitié »', () => {
    const lu = texte(ligne(false));
    expect(lu).toContain('Catégorie de leçons');
    expect(lu).toContain('dans la corbeille depuis le 3 novembre 2026 à 11:00');
    expect(lu).toContain('Avec 3 leçons et 12 progressions de lecteurs');
    expect(lu).toContain('Récupérable jusqu’au 3 décembre 2026 inclus');
    expect(lu).toContain('Remettre en place');
    expect(lu).toContain('Supprimer définitivement');
    expect(lu).not.toMatch(/incomplète|Terminer la restauration|Abandonner/);
  });

  it('les dates se lisent à l’heure de Niamey, celle de la purge, quel que soit le fuseau du navigateur', () => {
    // 0 h 30 le 3 novembre à Niamey, encore le 2 novembre en temps universel.
    const html = renderToStaticMarkup(
      <ul>
        <LigneCorbeille
          entree={{ ...ENTREE, supprime_le: '2026-11-02T23:30:00.000Z' }}
          enCours={false}
          confirmation={false}
          onRestaurer={sansAction}
          onDemanderSuppression={sansAction}
          onConfirmerSuppression={sansAction}
          onAnnuler={sansAction}
        />
      </ul>,
    );
    const lu = texte(html);
    expect(lu).toContain('dans la corbeille depuis le 3 novembre 2026 à 00:30');
    expect(lu).toContain('Récupérable jusqu’au 3 décembre 2026 inclus');
    // La date et « inclus » forment un seul bloc : « inclus » ne finit jamais seul une ligne.
    expect(html).toContain('3\u00a0décembre\u00a02026\u00a0inclus');
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
    // Un article emporte ses commentaires et ses j'aime : c'est dit avant.
    const article = texte(
      renderToStaticMarkup(
        <ul>
          <LigneCorbeille
            entree={{ ...ENTREE, table_origine: 'articles', titre: 'Le franc CFA', resume_dependants: {} }}
            enCours={false}
            confirmation
            onRestaurer={sansAction}
            onDemanderSuppression={sansAction}
            onConfirmerSuppression={sansAction}
            onAnnuler={sansAction}
          />
        </ul>,
      ),
    );
    expect(article).toContain('Définitif : « Le franc CFA » disparaîtra avec ses commentaires et ses j’aime, sans retour possible.');
  });

  it('une liste incomplète dit combien d’entrées plus anciennes restent, et propose de les afficher', () => {
    const plusieurs = texte(renderToStaticMarkup(<SuiteDeLaListe restantes={250} enCours={false} erreur={null} onAfficher={sansAction} />));
    expect(plusieurs).toContain('Encore 250 suppressions plus anciennes : ce sont les plus proches de leur suppression définitive.');
    expect(plusieurs).toContain('Afficher les suivantes');
    const une = texte(renderToStaticMarkup(<SuiteDeLaListe restantes={1} enCours={false} erreur={null} onAfficher={sansAction} />));
    expect(une).toContain('Encore une suppression plus ancienne : c’est la plus proche de sa suppression définitive.');
    const enPanne = texte(renderToStaticMarkup(<SuiteDeLaListe restantes={3} enCours={false} erreur="Le serveur ne répond pas." onAfficher={sansAction} />));
    expect(enPanne).toContain('Les suivantes n’ont pas pu être chargées : Le serveur ne répond pas.');
    expect(texte(renderToStaticMarkup(<SuiteDeLaListe restantes={3} enCours erreur={null} onAfficher={sansAction} />))).toContain('Chargement…');
  });

  it('les annonces et la note de liste tronquée posent la typographie française', () => {
    const html = renderToStaticMarkup(<BandeauAnnonce annonce={{ ton: 'succes', texte: '« Bourse » est de nouveau en place.', remarques: ['Une remarque : la voici.'] }} />);
    expect(html).toContain('\u202fBourse\u202f');
    expect(html).toContain('remarque\u00a0:');
    expect(texte(renderToStaticMarkup(<NoteTotal affichees={200} total={1450} />))).toBe('200 suppressions affichées sur 1 450, les plus récentes d’abord.');
    expect(renderToStaticMarkup(<NoteTotal affichees={3} total={3} />)).toBe('');
  });
});
