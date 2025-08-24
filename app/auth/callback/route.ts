import { NextRequest } from 'next/server';
import { createClient } from '../../../src/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token = searchParams.get('token');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/reset-password';

  console.log('Callback route params:', { code, token, token_hash, type, error, error_description, next });

  // Handle errors from Supabase
  if (error) {
    console.error('Supabase auth error:', { error, error_description });
    return redirect(`/auth/auth-code-error?error=${encodeURIComponent(error_description || error)}`);
  }

  const supabase = await createClient();

  // Handle PKCE flow (regular auth)
  if (code) {
    console.log('Processing PKCE code exchange...');
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log('PKCE code exchange successful');
      return redirect(`${origin}${next}`);
    } else {
      console.error('PKCE code exchange error:', error);
    }
  }

  // Handle password recovery flow with token_hash
  if (token_hash && type) {
    console.log('Processing password recovery with token_hash...');
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any
    });

    if (!error) {
      console.log('Password recovery verification successful');
      return redirect(`${origin}${next}`);
    } else {
      console.error('Password recovery verification error:', error);
    }
  }

  // Handle password recovery flow with token (alternative format)
  if (token && type === 'recovery') {
    console.log('Processing password recovery with token...');
    // For recovery tokens, we might need to use verifyOtp with the token as token_hash
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery' as any
    });

    if (!error) {
      console.log('Password recovery with token successful');
      return redirect(`${origin}${next}`);
    } else {
      console.error('Password recovery with token error:', error);
    }
  }

  console.log('No valid authentication parameters found, redirecting to error page');
  // return the user to an error page with instructions
  return redirect('/auth/auth-code-error');
}
