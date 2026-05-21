import type { Metadata } from 'next';
import { CommentsManager } from '../../CommentsManager';

export const metadata: Metadata = {
  title: 'Commentaires · NFI Cockpit',
  description: 'Modérer les commentaires des lecteurs.',
  robots: { index: false },
};

export default function ContenuCommentairesPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Commentaires</h1>
      <CommentsManager />
    </div>
  );
}
