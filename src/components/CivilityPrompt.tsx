'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { User, X } from 'lucide-react';

type Civility = 'M.' | 'Mme';

const DISMISS_KEY = 'nfi-civility-prompt-dismissed-at';
const DISMISS_COOLDOWN_DAYS = 7;

/**
 * Bandeau qui s'affiche pour les comptes Premium / admin dont la civilité
 * n'a pas encore été renseignée, afin de personnaliser les PDFs générés.
 * Non bloquant : un bouton "Plus tard" stocke un cooldown 7j en localStorage.
 * Pour les comptes free, le bandeau ne s'affiche pas (la civilité n'a pas
 * d'usage côté livrables tant que le compte n'est pas Premium).
 */
export function CivilityPrompt() {
  const pathname = usePathname() ?? '/';
  const isAdminSurface =
    pathname.startsWith('/admin') || pathname.startsWith('/dev-cockpit-preview');
  const { isSignedIn, profile, userRole, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<Civility | ''>('');
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAdminSurface) {
      setVisible(false);
      return;
    }
    if (!isSignedIn || !profile) {
      setVisible(false);
      return;
    }
    // Limite aux comptes Premium/admin pour eviter de spammer les free users
    if (userRole !== 'premium' && userRole !== 'admin') {
      setVisible(false);
      return;
    }
    const hasCivility = Boolean(profile.civility);
    if (hasCivility) {
      setVisible(false);
      return;
    }
    // Respecter le cooldown si l'utilisateur a ferme recemment
    try {
      const dismissed = window.localStorage.getItem(DISMISS_KEY);
      if (dismissed) {
        const ts = parseInt(dismissed, 10);
        if (Number.isFinite(ts) && Date.now() - ts < DISMISS_COOLDOWN_DAYS * 86400 * 1000) {
          setVisible(false);
          return;
        }
      }
    } catch {
      // localStorage indisponible (mode privé etc), on affiche par défaut
    }
    setVisible(true);
  }, [isAdminSurface, isSignedIn, profile, userRole]);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // localStorage indisponible : on cache juste pour la session
    }
    setVisible(false);
  };

  // Escape key to dismiss (a11y : SC 2.1.2 No Keyboard Trap)
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  if (!visible) return null;

  const handleSave = async () => {
    if (selected !== 'M.' && selected !== 'Mme') return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ civility: selected }),
      });
      if (res.ok) {
        await refreshProfile();
        try {
          window.localStorage.removeItem(DISMISS_KEY);
        } catch {
          // ignore
        }
        setVisible(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside
      aria-label="Indiquer votre civilité"
      className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-2xl shadow-[0_10px_60px_-10px_rgba(0,0,0,0.18)] border border-black/[0.06] p-5 animate-fade-in-up"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 bg-gold/10 rounded-full flex items-center justify-center shrink-0">
          <User className="w-4.5 h-4.5 text-gold" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#111]">Personnalisez vos documents</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            Indiquez votre civilité pour que vos rapports PDF soient établis à votre nom.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer"
          className="text-gray-500 hover:text-gray-600 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {(['M.', 'Mme'] as const).map((opt) => {
          const isSel = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setSelected(opt)}
              className={`text-sm rounded-lg px-3 py-2 border transition-all ${
                isSel
                  ? 'border-[#111] bg-[#fafaf9] text-[#111] font-medium'
                  : 'border-black/[0.08] bg-white text-gray-600 hover:border-black/[0.16]'
              }`}
            >
              {opt === 'M.' ? 'Monsieur' : 'Madame'}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!selected || saving}
        className="w-full bg-[#111] text-white text-[13px] py-2.5 rounded-lg hover:bg-[#222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? 'Enregistrement…' : 'Confirmer'}
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="w-full text-gray-500 text-[12px] mt-2 hover:text-gray-700 transition-colors"
      >
        Plus tard
      </button>
    </aside>
  );
}
