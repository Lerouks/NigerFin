'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { BoutonGoogle, useGoogleDisponible } from '@/components/auth/ConnexionGoogle';
import { FormulaireInscription } from '@/components/compte/FormulaireInscription';
import { safeNextPath } from '@/lib/validation';

/**
 * Créer un compte : le formulaire commun (src/components/compte/FormulaireInscription.tsx),
 * puis le code à 6 chiffres, puis l'écran de bienvenue, puis la page de départ
 * (« redirect » ou « next », un chemin du site seulement).
 */
function InscriptionContent() {
  const searchParams = useSearchParams();
  const google = useGoogleDisponible();
  const brut = searchParams.get('redirect') ?? searchParams.get('next');
  const suite = brut ? safeNextPath(brut) : null;
  const connexion = suite ? `/connexion?next=${encodeURIComponent(suite)}` : '/connexion';

  return (
    <AuthLayout>
      <div className="bg-white rounded-2xl shadow-[0_4px_40px_-12px_rgba(0,0,0,0.08)] p-6 min-[360px]:p-8 sm:p-10 animate-fade-in-up">
        <FormulaireInscription
          suite={suite}
          emailInitial={searchParams.get('email') ?? ''}
          entete={
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Créer un compte</h1>
              <p className="text-gray-500 text-sm">Rejoignez NFI{' '}Report gratuitement</p>
            </div>
          }
          pied={
            <>
              {google && (
                <>
                  <div className="relative my-7">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-black/6" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 bg-white text-gray-500">ou</span>
                    </div>
                  </div>
                  <BoutonGoogle suite={suite} />
                </>
              )}

              <p className="text-center text-sm text-gray-500 mt-7">
                Déjà un compte{' '}?{' '}
                <Link href={connexion} className="text-[#111] hover:text-gold font-semibold transition-colors">
                  Se{' '}connecter
                </Link>
              </p>
            </>
          }
        />
      </div>
    </AuthLayout>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense>
      <InscriptionContent />
    </Suspense>
  );
}
