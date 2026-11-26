import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Article } from '@/types';
import { fallbackImageUrl } from '@/data/mock-data';
import { SECTION_META } from '@/lib/sections';
import { getContentTypeFromArticle } from '@/lib/access-control';
import { SITE_URL } from '@/lib/config';
import { dimensionsImage } from '@/lib/article/dimensions-image';
import { dateArticle, enLignes, texteAffiche } from '@/lib/article/mise-en-page';
import { PartageHaut } from '@/components/article/BoutonsPartage';
import styles from './article.module.css';

interface ArticleHeaderProps {
  article: Article;
}

export const ID_ENTETE_ARTICLE = 'article-entete';

/**
 * En-tête de la page d'un article (direction « La colonne ») : rubriques,
 * titre, chapô (le sous-titre, sinon le résumé de l'article), auteur, date et
 * durée, partage, puis la photo entière à son format d'origine.
 * Rendu côté serveur, identique avec ou sans accès Premium, pour que la photo
 * (élément le plus lourd du premier écran) arrive avec la page.
 * Titre et chapô sont rendus en HTML échappé : le régleur des fins de ligne
 * peut y poser ses coupures sans gêner React.
 */
export async function ArticleHeader({ article }: ArticleHeaderProps) {
  const contentType = getContentTypeFromArticle(article);
  const isPremium = contentType !== 'free';
  const imageUrl = article.mainImage?.url || fallbackImageUrl;
  const dimensions = article.mainImage?.url ? await dimensionsImage(article.mainImage.url) : null;
  const chapo = article.subtitle || article.excerpt || '';
  const url = `${SITE_URL}/articles/${article.slug.current}`;
  const rubriques = article.sections?.length ? article.sections : [article.category];
  const largeur = dimensions?.largeur ?? 1600;
  const hauteur = dimensions?.hauteur ?? 900;

  return (
    <>
      <header className={styles.entete} id={ID_ENTETE_ARTICLE}>
        <p className={styles.rubriques}>
          {rubriques.map((s, i) => (
            <span key={s}>
              {i > 0 && <span className={styles.sep} aria-hidden="true">·</span>}
              <Link href={SECTION_META[s]?.path || `/${s}`}>{SECTION_META[s]?.label || s}</Link>
            </span>
          ))}
          {isPremium && (
            <span>
              <span className={styles.sep} aria-hidden="true">·</span>
              <span className={styles.premium}>Premium</span>
            </span>
          )}
        </p>
        <h1 className={styles.titre} dangerouslySetInnerHTML={{ __html: texteAffiche(article.title) }} />
        {chapo && <p className={styles.chapo} dangerouslySetInnerHTML={{ __html: enLignes(texteAffiche(chapo)) }} />}
        <div className={styles.signature}>
          <p className={styles.qui}>
            <strong>{article.author.name}</strong>
            <span className={styles.nowrap}>{dateArticle(article.publishedAt)}</span>
            <span className={styles.point}> · </span>
            <span className={`${styles.nowrap} ${styles.duree}`}>{`${article.readTime}\u00a0min de lecture`}</span>
          </p>
          <PartageHaut url={url} titre={article.title} />
        </div>
      </header>

      <figure className={styles.photo} style={{ '--l': `${largeur}px` } as CSSProperties}>
        <Image
          src={imageUrl}
          alt={article.mainImage?.alt || article.title}
          width={largeur}
          height={hauteur}
          sizes="(max-width: 640px) 100vw, 820px"
          quality={90}
          priority
          fetchPriority="high"
        />
        {(article.mainImage?.caption || article.mainImage?.source) && (
          <figcaption>
            <span>{article.mainImage?.caption || ''}</span>
            {article.mainImage?.source && <span className={styles.nowrap}>{`Source\u00a0: ${article.mainImage.source}`}</span>}
          </figcaption>
        )}
      </figure>
    </>
  );
}
