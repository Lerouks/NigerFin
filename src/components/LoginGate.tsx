'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

interface LoginGateProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: () => void;
  articleTitle?: string;
}

export function LoginGate({
  isOpen,
  onClose,
  onLogin,
  articleTitle,
}: LoginGateProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setMounted(false);
      return;
    }
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => setMounted(true));

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Connexion requise"
    >
      {/* Overlay noir semi-transparent */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modale blanche centrée */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl outline-none transition-all duration-300 ease-out ${
          mounted ? 'translate-y-0 scale-100' : 'translate-y-6 scale-95'
        }`}
      >
        {/* Bouton fermeture (X) en haut à droite */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo / Brand */}
        <div className="text-center mb-6">
          <span className="text-[22px] font-bold tracking-[-0.03em]">NFI Report</span>
        </div>

        {/* Titre + message */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2">Connectez-vous pour lire la suite</h2>
          <p className="text-gray-500 text-[14px] leading-relaxed">
            {articleTitle
              ? `Accédez à "${articleTitle}" et à toutes nos analyses en vous connectant.`
              : 'Connectez-vous pour accéder à cette analyse exclusive.'}
          </p>
        </div>

        {/* CTA buttons */}
        <Link
          href="/connexion"
          onClick={onLogin}
          className="block w-full bg-[#111] text-white py-3 rounded-lg hover:bg-[#333] active:bg-[#000] transition-colors text-center text-[14px] font-medium"
        >
          Se connecter
        </Link>

        <Link
          href="/inscription"
          className="block w-full mt-3 border border-black/[0.08] py-3 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors text-[14px] text-center"
        >
          Créer un compte — c&apos;est gratuit
        </Link>

        {/* Avantages */}
        <div className="mt-6 pt-6 border-t border-black/[0.05]">
          <div className="bg-[#fafaf9] p-4 rounded-lg">
            <h4 className="font-semibold text-[13px] mb-2">Avec un compte NFI Report :</h4>
            <ul className="space-y-1.5 text-[12px] text-gray-600">
              <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span>Accédez aux analyses premium</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span>Commentez et interagissez avec la communauté</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span>Recevez notre newsletter mensuelle</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span>Suivez les sujets qui vous intéressent</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
