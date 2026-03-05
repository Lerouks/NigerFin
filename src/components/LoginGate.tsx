'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';

interface LoginGateProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export function LoginGate({
  isOpen,
  onClose,
  title = 'Rejoignez NFI Report',
  message = 'Connectez-vous pour accéder à cette analyse exclusive.',
}: LoginGateProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="text-[22px] font-bold tracking-[-0.03em]">NFI Report</span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="text-gray-500 text-[14px]">{message}</p>
        </div>

        <Link
          href="/connexion"
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

        <div className="mt-6 pt-6 border-t border-black/[0.05]">
          <div className="bg-[#fafaf9] p-4 rounded-lg">
            <h4 className="font-semibold text-[13px] mb-2">Avec un compte NFI Report :</h4>
            <ul className="space-y-1.5 text-[12px] text-gray-600">
              <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span>Accédez aux analyses premium</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span>Commentez et interagissez avec la communauté</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span>Recevez notre newsletter quotidienne</li>
              <li className="flex items-center gap-2"><span className="text-emerald-500">&#10003;</span>Suivez les sujets qui vous intéressent</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
