import { NextRequest } from 'next/server';
import { createClient } from '../../../src/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  console.log('Callback route params:', { code, type, error, error_description });

  // Handle errors from Supabase
  if (error) {
    console.error('Supabase auth error:', { error, error_description });
    return redirect(`/auth/auth-code-error?error=${encodeURIComponent(error_description || error)}`);
  }

  const supabase = await createClient();

  // Handle magic link authentication
  if (code) {
    console.log('Processing magic link authentication...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data?.user) {
      console.log('Magic link authentication successful for user:', data.user.email);
      
      // Check if this is a password recovery flow
      if (type === 'recovery') {
        console.log('Password recovery flow detected, redirecting to update-password');
        return redirect(`${origin}/update-password`);
      }
      
      // Regular authentication flow
      return redirect(`${origin}/`);
    } else {
      console.error('Magic link authentication error:', error);
      return redirect(`/auth/auth-code-error?error=${encodeURIComponent(error?.message || 'Authentication failed')}`);
    }
  }

  console.log('No valid authentication code found, redirecting to error page');
  return redirect('/auth/auth-code-error?error=Invalid authentication link');
}
