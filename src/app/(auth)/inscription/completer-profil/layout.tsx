import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complétez votre profil - NFI Report',
  robots: { index: false },
};

export default function CompleterProfilLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
