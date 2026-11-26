'use client';

/**
 * La discussion d'un article, repliée en une ligne : son état (aucun
 * commentaire, ou leur nombre) et un bouton qui ouvre la discussion complète
 * (le composant CommentsSection, inchangé).
 */
import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { CommentsSection } from '@/components/CommentsSection';
import styles from '@/app/articles/[slug]/article.module.css';

export function DiscussionRepliee({ articleId, id }: { articleId: string; id: string }) {
  const [ouverte, setOuverte] = useState(false);
  const [nombre, setNombre] = useState<number | null>(null);

  useEffect(() => {
    let annule = false;
    fetch(`/api/comments?article_id=${encodeURIComponent(articleId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (annule || !json) return;
        const liste = Array.isArray(json) ? json : json.data;
        if (Array.isArray(liste)) setNombre(liste.length);
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, [articleId]);

  // Arrivée par le bouton de la barre (#discussion) : la discussion s'ouvre.
  useEffect(() => {
    const ouvrirSiCible = () => {
      if (window.location.hash === `#${id}`) setOuverte(true);
    };
    ouvrirSiCible();
    window.addEventListener('hashchange', ouvrirSiCible);
    return () => window.removeEventListener('hashchange', ouvrirSiCible);
  }, [id]);

  const etat =
    nombre === null || nombre === 0
      ? 'Aucun commentaire pour le moment.'
      : nombre === 1
        ? '1\u00a0commentaire.'
        : `${nombre}\u00a0commentaires.`;

  return (
    <section className={styles.discussion} id={id} aria-labelledby={`${id}-titre`}>
      {ouverte ? (
        <CommentsSection articleId={articleId} />
      ) : (
        <div className={styles.discussionTete}>
          <div>
            <h2 className={styles.finTitre} id={`${id}-titre`}>Discussion</h2>
            <span className={styles.discussionEtat}>{etat}</span>
          </div>
          <button type="button" className={styles.bouton} onClick={() => setOuverte(true)} aria-expanded={ouverte}>
            <MessageCircle className={styles.icone} aria-hidden="true" />
            {nombre ? 'Lire et commenter' : 'Écrire un commentaire'}
          </button>
        </div>
      )}
    </section>
  );
}
