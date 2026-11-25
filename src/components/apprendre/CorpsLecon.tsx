import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { rehypeLecon } from '@/lib/apprendre/rehype-lecon';
import styles from './lecon.module.css';

/**
 * Le corps d'une leçon, depuis son Markdown. Sans état ni effet : rendu tel
 * quel sur le serveur (leçon gratuite, lue par Google) et dans le navigateur
 * (leçon Premium, chargée après vérification de l'abonnement).
 */
export function CorpsLecon({ markdown }: { markdown: string }) {
  return (
    <div className={styles.corps}>
      <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeLecon]}>{markdown}</ReactMarkdown>
    </div>
  );
}
