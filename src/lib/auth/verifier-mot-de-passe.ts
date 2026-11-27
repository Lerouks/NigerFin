/**
 * Vérifie le mot de passe actuel d'un lecteur, côté serveur, avant une action
 * sensible (changer de mot de passe ou d'adresse, supprimer son compte).
 *
 * La demande part avec la clé de service : Supabase la dispense du contrôle
 * anti-robots (Turnstile), qui sinon refuserait toute connexion par mot de
 * passe venue du serveur. La session ouverte pour la vérification est fermée
 * aussitôt : elle ne reste pas dans la liste des appareils du lecteur.
 */
export async function motDePasseCorrect(email: string, motDePasse: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service || !email || !motDePasse) return false;
  try {
    const reponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: motDePasse }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!reponse.ok) return false;
    const corps = (await reponse.json()) as { access_token?: string };
    if (corps.access_token) {
      await fetch(`${url}/auth/v1/logout?scope=local`, {
        method: 'POST',
        headers: { apikey: service, Authorization: `Bearer ${corps.access_token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      }).catch(() => {});
    }
    return Boolean(corps.access_token);
  } catch {
    return false;
  }
}
