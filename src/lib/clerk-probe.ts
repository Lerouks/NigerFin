// Sonde asynchrone Clerk avec timeout de 2 secondes
let clerkAvailable = false;
let clerkCheckComplete = false;

const CLERK_PUBLISHABLE_KEY = import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder';

// Fonction de sonde asynchrone
async function probeClerkAvailability(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    // Tentative de vérification si Clerk est accessible
    const response = await fetch('https://api.clerk.dev/v1/public/health', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Clerk n'est pas accessible ou timeout
    return false;
  }
}

// Lancement de la sonde au chargement du module avec gestion d'erreurs
probeClerkAvailability()
  .then((available) => {
    clerkAvailable = available;
    clerkCheckComplete = true;
  })
  .catch(() => {
    // En cas d'erreur, marquer comme non disponible
    clerkAvailable = false;
    clerkCheckComplete = true;
  });

export function isClerkAvailable(): boolean {
  return clerkAvailable;
}

export function isClerkCheckComplete(): boolean {
  return clerkCheckComplete;
}

export function getClerkPublishableKey(): string {
  return CLERK_PUBLISHABLE_KEY;
}
