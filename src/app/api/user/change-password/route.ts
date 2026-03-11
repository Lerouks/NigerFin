import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase';
import { sendTransactionalEmail } from '@/lib/email';
import { passwordChangedEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Configuration manquante.' }, { status: 500 });
  }

  // Create a server Supabase client with the user's cookies
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // We don't need to set cookies on this API route
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  let body: { currentPassword: string; newPassword: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return NextResponse.json({ error: 'Le mot de passe actuel est incorrect.' }, { status: 400 });
  }

  // Update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.' }, { status: 500 });
  }

  // Send confirmation email
  try {
    const service = createServiceClient();
    const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
    const template = passwordChangedEmail(fullName);
    await sendTransactionalEmail({ to: user.email, ...template });
  } catch {
    // Email sending failure shouldn't block the password change success
  }

  return NextResponse.json({ message: 'Votre mot de passe a été mis à jour avec succès.' });
}
