import { cookies } from 'next/headers';
import { getMicrosoftAuthorizationUrl, createOAuthState, microsoftStateCookie } from '@/lib/auth/microsoft';

export async function GET() {
  try {
    const state = createOAuthState();
    const cookieStore = await cookies();
    cookieStore.set(microsoftStateCookie, state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600,
      path: '/',
    });
    return Response.redirect(getMicrosoftAuthorizationUrl(state));
  } catch (error) {
    return Response.json({ error: error.message || 'Microsoft 365 no está configurado.' }, { status: 500 });
  }
}
