import { redirect } from 'next/navigation';

// Redirection serveur depuis la nouvelle taxonomie Contenu vers la route
// historique /admin/newsletter (preservation des deep links, du bookmark
// Notion, et de l'index Google). Le hub Contenu link deja directement vers
// /admin/newsletter, donc cette route est un filet de securite pour les
// utilisateurs qui tapent l'URL "logique" /admin/contenu/newsletter.
export default function ContenuNewsletterRedirect() {
  redirect('/admin/newsletter');
}
