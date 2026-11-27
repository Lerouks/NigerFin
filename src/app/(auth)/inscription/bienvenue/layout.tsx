import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bienvenue',
  robots: { index: false },
};

export default function BienvenueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
