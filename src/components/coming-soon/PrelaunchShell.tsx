import Link from 'next/link';

/**
 * Habillage des pages restées ouvertes pendant le pré-lancement (pages
 * légales, connexion, désabonnement) pour un visiteur qui n'est pas admin.
 *
 * Avant, ces pages portaient le menu complet du site : depuis le lien
 * « Politique de confidentialité » de la page d'attente, un visiteur se
 * retrouvait « dans le site », avec les rubriques, la recherche et son
 * compte. Ici, il ne voit que la marque, le texte demandé et le retour à la
 * page d'attente, comme sur celle-ci.
 */
export function PrelaunchShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background text-[#111111]">
      <header className="px-6 pt-8 sm:px-10 lg:px-16 lg:pt-10">
        <Link href="/" className="inline-block" aria-label="NFI Report, retour à l’accueil">
          <p className="font-[family-name:var(--font-playfair)] text-[22px] font-bold tracking-[0.01em]">NFI&nbsp;REPORT</p>
          <p className="mt-1 text-[12px] text-[#111111]/45">Niger Financial Insights</p>
        </Link>
      </header>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <footer className="px-6 pb-8 pt-10 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="text-[14px] font-semibold text-[#111111] underline decoration-[#111111]/30 underline-offset-4 hover:decoration-[#111111]"
        >
          Retour à l’accueil
        </Link>
      </footer>
    </div>
  );
}
