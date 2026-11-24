'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { chargementComplet } from '@/lib/chargement-complet';
import { getBillingOption } from '@/config/pricing';
import { dateFr, etatAbonnement, salutation, type ResumeDuCompte } from '@/lib/compte';
import { CompteVue, type ActionsCompte, type DonneesCompte, type ProfilAffiche, type Reponse } from './CompteVue';

/**
 * « Mon compte » : les données du lecteur et ses actions, affichées par
 * CompteVue. Le profil vient du contexte de connexion ; l'abonnement, les
 * factures, la connexion et la newsletter de /api/user/account-summary.
 */

async function lireErreur(res: Response, defaut: string): Promise<string> {
  try {
    const corps = (await res.json()) as { error?: string };
    return corps.error || defaut;
  } catch {
    return defaut;
  }
}

const RESEAU = 'La connexion a échoué. Vérifiez votre réseau puis réessayez.';

export function AccountDashboard() {
  const { isSignedIn, isLoading, user, profile, userRole, signOut, signOutEverywhere, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reinitialisation = searchParams.get('reset') === 'true';
  const [resume, setResume] = useState<ResumeDuCompte | null>(null);
  const [resumeLu, setResumeLu] = useState(false);
  const [maintenant, setMaintenant] = useState<number | null>(null);

  useEffect(() => {
    setMaintenant(Date.now());
  }, []);

  useEffect(() => {
    // Le lien d'un mail (« #factures », « #newsletter ») survit à la connexion.
    if (!isLoading && !isSignedIn) router.replace(`/connexion?next=${encodeURIComponent(`/compte${window.location.hash}`)}`);
  }, [isLoading, isSignedIn, router]);

  const chargerResume = useCallback(async () => {
    try {
      const res = await fetch('/api/user/account-summary', { cache: 'no-store' });
      if (res.ok) setResume((await res.json()) as ResumeDuCompte);
    } catch {
      // La page reste utilisable : les factures et la newsletter disent qu'elles n'ont pas pu être lues.
    } finally {
      setResumeLu(true);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) void chargerResume();
  }, [isSignedIn, chargerResume]);

  const profilAffiche: ProfilAffiche = useMemo(() => ({
    civilite: profile?.civility ?? '',
    prenom: profile?.first_name ?? '',
    nom: profile?.last_name ?? '',
    profession: profile?.profession ?? '',
    telephone: profile?.phone ?? '',
    adresse: profile?.address ?? '',
    ville: profile?.city ?? '',
    codePostal: profile?.postal_code ?? '',
    pays: profile?.country ?? '',
    jourNaissance: profile?.birth_day != null ? String(profile.birth_day) : '',
    moisNaissance: profile?.birth_month != null ? String(profile.birth_month) : '',
    anneeNaissance: profile?.birth_year != null ? String(profile.birth_year) : '',
  }), [profile]);

  const actions: ActionsCompte = useMemo(() => ({
    async enregistrerProfil(p): Promise<Reponse> {
      try {
        const res = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            civility: p.civilite || null,
            first_name: p.prenom.trim(),
            last_name: p.nom.trim(),
            phone: p.telephone || null,
            birth_day: p.jourNaissance ? Number(p.jourNaissance) : null,
            birth_month: p.moisNaissance ? Number(p.moisNaissance) : null,
            birth_year: p.anneeNaissance ? Number(p.anneeNaissance) : null,
            address: p.adresse.trim() || null,
            city: p.ville.trim() || null,
            postal_code: p.codePostal.trim() || null,
            country: p.pays || null,
            profession: p.profession || null,
          }),
        });
        if (!res.ok) return { ok: false, message: await lireErreur(res, 'L’enregistrement a échoué. Réessayez.') };
        await refreshProfile();
        return { ok: true, message: 'Vos informations sont enregistrées.' };
      } catch {
        return { ok: false, message: RESEAU };
      }
    },

    async changerMotDePasse({ actuel, nouveau }): Promise<Reponse> {
      try {
        if (reinitialisation) {
          // Lien « mot de passe oublié » : la session de récupération suffit.
          const { createBrowserSupabaseClient } = await import('@/lib/supabase-browser');
          const client = createBrowserSupabaseClient();
          if (!client) return { ok: false, message: 'Service indisponible.' };
          const { error } = await client.auth.updateUser({ password: nouveau });
          if (error) return { ok: false, message: 'Le mot de passe n’a pas pu être changé. Redemandez un lien de réinitialisation.' };
          router.replace('/compte');
          return { ok: true, message: 'Votre nouveau mot de passe est enregistré.' };
        }
        const res = await fetch('/api/user/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(actuel ? { currentPassword: actuel, newPassword: nouveau } : { newPassword: nouveau }),
        });
        const corps = (await res.json().catch(() => ({}))) as { message?: string; error?: string; reconnexion?: boolean };
        if (!res.ok) return { ok: false, message: corps.error || 'Erreur. Réessayez.', reconnexion: corps.reconnexion };
        if (!actuel) await chargerResume();
        return { ok: true, message: corps.message || 'Votre mot de passe est enregistré.' };
      } catch {
        return { ok: false, message: RESEAU };
      }
    },

    async changerNewsletter(recevoir) {
      try {
        const res = await fetch('/api/user/newsletter', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recevoir }),
        });
        if (!res.ok) return { ok: false, message: await lireErreur(res, 'Le changement n’a pas pu être enregistré. Réessayez.') };
        const etat = (await res.json()) as { recoit: boolean; bloquee: boolean };
        return { ok: true, message: '', etat };
      } catch {
        return { ok: false, message: RESEAU };
      }
    },

    async deconnexion() {
      await signOut();
      chargementComplet('/');
    },

    async deconnexionPartout(): Promise<Reponse> {
      const { error } = await signOutEverywhere();
      if (error) return { ok: false, message: 'La déconnexion a échoué. Réessayez.' };
      chargementComplet('/');
      return { ok: true, message: '' };
    },

    async supprimerCompte(): Promise<Reponse> {
      try {
        const res = await fetch('/api/user/delete-account', { method: 'DELETE' });
        if (!res.ok) {
          const corps = (await res.json().catch(() => ({}))) as { error?: string; factures?: boolean };
          return { ok: false, message: corps.error || 'La suppression n’a pas abouti.', factures: corps.factures === true };
        }
        await signOut();
        chargementComplet('/');
        return { ok: true, message: '' };
      } catch {
        return { ok: false, message: RESEAU };
      }
    },
  }), [reinitialisation, refreshProfile, router, chargerResume, signOut, signOutEverywhere]);

  if (isLoading || !isSignedIn || maintenant === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f2f3]">
        <Loader2 className="h-8 w-8 animate-spin text-[#6b6f76]" aria-label="Chargement du compte" />
      </div>
    );
  }

  const role = userRole === 'admin' || userRole === 'premium' ? userRole : 'reader';
  const donnees: DonneesCompte = {
    salutation: salutation(profile),
    email: user?.email ?? profile?.email ?? '',
    membreDepuis: dateFr(profile?.created_at),
    role,
    abonnement: etatAbonnement({ role, abonnement: resume?.subscription ?? null, profil: profile, maintenant }),
    factures: resumeLu ? (resume ? resume.invoices : null) : undefined,
    profil: profilAffiche,
    // Résumé illisible : on propose de modifier le mot de passe, le cas le plus courant.
    connexion: resume?.connexion ?? (resumeLu ? { motDePasse: true, google: false } : undefined),
    newsletter: resumeLu ? (resume ? resume.newsletter : null) : undefined,
    erreurChargement: resumeLu && !resume,
    reinitialisation,
    prixMensuel: getBillingOption('monthly').price,
  };

  return <CompteVue donnees={donnees} actions={actions} />;
}
