'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { isNewsletterSubscribed, markNewsletterSubscribed } from '@/components/NewsletterPopup';
import { useToast } from '@/components/Toast';
import {
  estUnEchec,
  inscrireALaNewsletter,
  MESSAGE_ADRESSE_DEJA_INSCRITE,
  MESSAGES_ECHEC,
} from '@/lib/newsletter/inscription';

/**
 * Ce que le bloc affiche à la place du formulaire :
 * - 'ici' : le compte connecté, ou cet appareil, est déjà inscrit ;
 * - 'adresse' : l'adresse tapée l'était déjà (rien n'a été envoyé) ;
 * - 'confirmee' : l'adresse vient d'être inscrite.
 */
type Etat = 'formulaire' | 'ici' | 'adresse' | 'confirmee';

export function NewsletterForm() {
  const { userRole, profile, isLoading } = useAuth();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [inscritIci, setInscritIci] = useState(false);
  const [etat, setEtat] = useState<Etat>('formulaire');
  // Un appareil partagé ne doit pas empêcher une deuxième personne de s'inscrire.
  const [autreAdresse, setAutreAdresse] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  // Déjà inscrit ici : cet appareil (localStorage), le compte (case newsletter), ou premium et admin.
  useEffect(() => {
    if (isNewsletterSubscribed()) setInscritIci(true);
  }, []);

  useEffect(() => {
    if (!isLoading && (userRole === 'premium' || userRole === 'admin' || profile?.newsletter_subscribed)) {
      setInscritIci(true);
    }
  }, [isLoading, userRole, profile]);

  const affichage: Etat = etat === 'formulaire' && inscritIci && !autreAdresse ? 'ici' : etat;

  const inscrireUneAutreAdresse = () => {
    setAutreAdresse(true);
    setEtat('formulaire');
    setEmail('');
    setErreur(null);
    requestAnimationFrame(() => champ.current?.focus());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !email.trim()) return;

    setLoading(true);
    setErreur(null);
    const issue = await inscrireALaNewsletter(email, 'form_home');
    setLoading(false);

    if (estUnEchec(issue)) {
      // L'adresse reste dans le champ : on la corrige au lieu de tout retaper.
      setErreur(MESSAGES_ECHEC[issue]);
      return;
    }

    markNewsletterSubscribed();
    if (issue === 'deja-inscrit') {
      setEtat('adresse');
    } else {
      setEtat('confirmee');
      show('Merci, vous êtes inscrit à la newsletter NFI Report.', 'success');
    }
  };

  const confirmation = (texte: string, autre: boolean) => (
    <div className="flex items-center gap-3 bg-white/10 rounded-lg px-5 py-4" role="status" aria-live="polite">
      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
        <Check className="w-4 h-4 text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[14px] text-white/80 text-balance">{texte}</p>
        {autre && (
          <button
            type="button"
            onClick={inscrireUneAutreAdresse}
            className="-my-2 inline-flex min-h-[44px] items-center text-balance text-left text-[13px] text-white/55 underline underline-offset-2 hover:text-white/80 transition-colors"
          >
            Inscrire une autre adresse
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div id="newsletter" className="relative overflow-hidden rounded-xl bg-[#111] p-8 md:p-10 scroll-mt-[180px]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/2 rounded-full -translate-y-1/2 translate-x-1/2" />
      <h3 className="text-[22px] md:text-[26px] text-white mb-2 leading-tight font-semibold">
        Ne manquez rien de l’actualité économique
      </h3>
      <p className="text-[14px] text-white/45 mb-7 max-w-md">
        Briefings, analyses et données de marché. Recevez le meilleur de NFI Report dans votre boîte mail.
      </p>

      {affichage === 'ici' ? (
        confirmation('Vous êtes déjà inscrit à la newsletter.', true)
      ) : affichage === 'adresse' ? (
        confirmation(MESSAGE_ADRESSE_DEJA_INSCRITE, true)
      ) : affichage === 'confirmee' ? (
        confirmation('Inscription confirmée !', false)
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              ref={champ}
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (erreur) setErreur(null);
              }}
              placeholder="Votre adresse email"
              aria-label="Adresse email pour la newsletter"
              aria-invalid={erreur !== null}
              aria-describedby={erreur ? 'newsletter-erreur' : undefined}
              autoComplete="email"
              className="flex-1 px-4 py-3 rounded-lg bg-white/8 border border-white/8 text-white placeholder:text-white/30 focus:outline-hidden focus:border-white/20 transition-all text-[16px]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-white text-black px-6 py-3 rounded-lg hover:bg-white/90 transition-all duration-200 flex items-center justify-center gap-2 text-[14px] shrink-0 disabled:opacity-50 active:scale-[0.97] font-medium"
            >
              {loading ? 'Envoi…' : 'S’inscrire'}
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
          {erreur && (
            <p id="newsletter-erreur" role="alert" className="mt-3 text-[13px] text-red-400 text-balance">
              {erreur}
            </p>
          )}
        </form>
      )}
      <p className="text-[11px] text-white/20 mt-4">Gratuit. Désinscription à tout moment.</p>
    </div>
  );
}
