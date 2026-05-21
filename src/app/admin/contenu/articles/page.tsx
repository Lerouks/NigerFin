import type { Metadata } from 'next';
import { ArticlesManager } from '../../ArticlesManager';

export const metadata: Metadata = {
  title: 'Articles · NFI Cockpit',
  description: 'Publier, modifier et organiser les articles éditoriaux.',
  robots: { index: false },
};

export default function ContenuArticlesPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-5 pt-6 pb-6">
      <h1 className="sr-only">Articles</h1>
      <ArticlesManager />
    </div>
  );
}
