import type { Metadata } from 'next';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { CockpitView } from './CockpitView';

export const metadata: Metadata = {
  title: 'NFI Cockpit',
  description: 'Tableau de bord NFI Report : vue d\'ensemble du business en un coup d\'œil.',
  robots: { index: false },
};

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const service = createServiceClient();
  let firstName = 'Raouf';
  let initials = 'RB';

  if (supabase && service) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await service
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      if (profile?.full_name) {
        const trimmed = profile.full_name.trim();
        const parts = trimmed.split(/\s+/);
        firstName = parts[0] ?? firstName;
        const a = parts[0]?.charAt(0) ?? '';
        const b = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : '';
        initials = (a + b).toUpperCase() || initials;
      } else if (profile?.email) {
        firstName = profile.email.split('@')[0] ?? firstName;
        initials = firstName.slice(0, 2).toUpperCase();
      }
    }
  }

  return (
    <>
      <h1 className="sr-only">NFI Cockpit</h1>
      <CockpitView greeting={{ initials, firstName }} />
    </>
  );
}
