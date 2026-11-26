'use client';

/**
 * Barre collante du téléphone et de la tablette (choix de la direction,
 * 26/11/2026) : WhatsApp reste sous le pouce pendant la lecture. Elle
 * apparaît une fois l'en-tête de l'article passé, s'efface dès que la fin de
 * l'article ou le pied de page arrive, et attend que le bandeau des cookies
 * ait reçu une réponse (géré en CSS par la classe du body).
 */
import { useEffect, useState } from 'react';
import { MessageCircle, Share } from 'lucide-react';
import styles from '@/app/articles/[slug]/article.module.css';
import { IconeWhatsApp, MessagePartage, liensPartage, usePartage } from './BoutonsPartage';

interface BarreLectureProps {
  url: string;
  titre: string;
  /** id de l'en-tête de l'article (la barre apparaît une fois passé). */
  idEntete: string;
  /** id du bloc de fin d'article (la barre s'efface quand il arrive). */
  idFin: string;
  /** id de la discussion, où mène le bouton des commentaires. */
  idDiscussion: string;
}

export function BarreLecture({ url, titre, idEntete, idFin, idDiscussion }: BarreLectureProps) {
  const [apresEntete, setApresEntete] = useState(false);
  const [finVisible, setFinVisible] = useState(false);
  const { message, partager } = usePartage(url, titre);
  const liens = liensPartage(url, titre);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const entete = document.getElementById(idEntete);
    const fins = [document.getElementById(idFin), document.querySelector('footer')].filter((e): e is HTMLElement => Boolean(e));
    const visibles = new Set<Element>();
    const surEntete = new IntersectionObserver(([e]) => {
      if (e) setApresEntete(!e.isIntersecting && e.boundingClientRect.top < 0);
    });
    const surFin = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)));
      setFinVisible(visibles.size > 0);
    });
    if (entete) surEntete.observe(entete);
    fins.forEach((f) => surFin.observe(f));
    return () => {
      surEntete.disconnect();
      surFin.disconnect();
    };
  }, [idEntete, idFin]);

  const visible = apresEntete && !finVisible;

  return (
    <div className={`${styles.barre} ${visible ? styles.barreVisible : ''}`} data-flottant="barre-lecture" aria-hidden={!visible}>
      <a className={`${styles.bouton} ${styles.plein}`} href={liens.whatsapp} target="_blank" rel="noopener noreferrer" tabIndex={visible ? 0 : -1} aria-label="Envoyer sur WhatsApp">
        <IconeWhatsApp className={styles.icone} />
        WhatsApp
      </a>
      <a className={`${styles.bouton} ${styles.rond}`} href={`#${idDiscussion}`} tabIndex={visible ? 0 : -1} aria-label="Aller à la discussion">
        <MessageCircle className={styles.icone} aria-hidden="true" />
      </a>
      <button type="button" className={`${styles.bouton} ${styles.rond}`} onClick={partager} tabIndex={visible ? 0 : -1} aria-label="Partager">
        <Share className={styles.icone} aria-hidden="true" />
      </button>
      <MessagePartage message={message} />
    </div>
  );
}
