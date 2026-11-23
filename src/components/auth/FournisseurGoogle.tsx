import { googleDisponible } from '@/lib/auth/google-disponible';
import { GoogleDisponible } from './ConnexionGoogle';

/** Dit aux pages de connexion et d'inscription si le bouton Google s'affiche. */
export async function FournisseurGoogle({ children }: { children: React.ReactNode }) {
  return <GoogleDisponible valeur={await googleDisponible()}>{children}</GoogleDisponible>;
}
