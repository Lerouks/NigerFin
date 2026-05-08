import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase';
import { getIssue } from '@/lib/newsletter/issues';
import { EditorClient } from './EditorClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditNewsletterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect('/connexion?next=/admin/newsletter');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/connexion?next=/admin/newsletter');

  const service = createServiceClient();
  if (!service) {
    return (
      <div className="p-10 text-sm text-red-700">Service indisponible (Supabase service client manquant).</div>
    );
  }
  const { data: profile } = await service
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return (
      <div className="p-10 text-sm text-red-700">Accès refusé. Rôle admin requis.</div>
    );
  }

  const issue = await getIssue(id);
  if (!issue) notFound();

  return <EditorClient issue={issue} />;
}
