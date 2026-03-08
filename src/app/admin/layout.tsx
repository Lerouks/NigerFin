import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';

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

  return <>{children}</>;
}
