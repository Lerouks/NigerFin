import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { AdminShell } from './AdminShell';

// Metadata PWA scope /admin : permet l installation sur ecran d accueil iPhone
// + Android avec icone, splash screen et fenetre standalone.
export const metadata: Metadata = {
  title: { default: 'NFI Cockpit', template: '%s · NFI Cockpit' },
  description: 'Tableau de bord administrateur NFI Report : pilote ton media en temps reel.',
  manifest: '/manifest.webmanifest',
  applicationName: 'NFI Cockpit',
  appleWebApp: {
    capable: true,
    title: 'NFI Cockpit',
    statusBarStyle: 'default',
    startupImage: ['/icons/apple-touch-icon.png'],
  },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  robots: { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect('/');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/connexion');

  const service = createServiceClient();
  if (!service) redirect('/');

  const { data: profile } = await service
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return <AdminShell>{children}</AdminShell>;
}
