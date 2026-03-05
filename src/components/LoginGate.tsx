'use client';

import { X } from 'lucide-react';
import { SignInButton } from '@clerk/nextjs';
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
  title = 'Contenu Premium',
  message = "Connectez-vous pour accéder à ce contenu",
}: LoginGateProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>

        <SignInButton mode="modal">
          <button className="w-full bg-[#111] text-white py-3 rounded-lg hover:bg-[#333] transition-colors">
            Se connecter
          </button>
        </SignInButton>

        <div className="mt-4">
          <SignInButton mode="modal">
            <button className="w-full border border-black/[0.08] py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Créer un compte gratuitement
            </button>
          </SignInButton>
        </div>

        <div className="mt-6 pt-6 border-t border-black/[0.05]">
          <Link
            href="/pricing"
            className="block text-center text-sm text-gray-500 hover:text-black transition-colors"
          >
            Voir nos abonnements Premium &rarr;
          </Link>
        </div>

        <div className="mt-6 bg-[#fafaf9] p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Avec un compte NFI REPORT :</h4>
          <ul className="space-y-1.5 text-xs text-gray-600">
            <li>&#10003; Accès illimité aux articles premium</li>
            <li>&#10003; Commentez et interagissez avec la communauté</li>
            <li>&#10003; Recevez notre newsletter quotidienne</li>
            <li>&#10003; Suivez les sujets qui vous intéressent</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
