import { cookies } from 'next/headers';
import {
  createSessionToken,
  exchangeCodeForToken,
  findLinkedUser,
  getMicrosoftProfile,
  microsoftSessionCookie,
  microsoftStateCookie,
  validateMicrosoftIdToken,
} from '@/lib/auth/microsoft';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieStore = await cookies();
  const savedState = cookieStore.get(microsoftStateCookie)?.value;
  const redirectUrl = new URL('/login', url.origin);

  if (!code || !state || !savedState || state !== savedState) {
    redirectUrl.searchParams.set('error', 'La validación de Microsoft expiró o no es válida.');
    return Response.redirect(redirectUrl);
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    const claims = await validateMicrosoftIdToken(tokens.id_token);
    const microsoftProfile = await getMicrosoftProfile(tokens.access_token);
    const user = await findLinkedUser({
      ...claims,
      preferred_username: claims.preferred_username
        || claims.email
        || claims.upn
        || claims.unique_name
        || microsoftProfile.mail
        || microsoftProfile.userPrincipalName,
      oid: claims.oid || microsoftProfile.id,
    });
    if (!user || user.rejected === 'inactive_role') {
      redirectUrl.searchParams.set(
        'error',
        user?.rejected === 'inactive_role'
          ? 'Actualmente no cuentas con el rol activo para acceder al sistema.'
          : 'Tu cuenta Microsoft no está vinculada a un usuario activo.'
      );
      return Response.redirect(redirectUrl);
    }

    const session = await createSessionToken(user);
    cookieStore.set(microsoftSessionCookie, session, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 8 * 60 * 60,
      path: '/',
    });
    cookieStore.delete(microsoftStateCookie);
    return Response.redirect(new URL('/loading?next=/dashboard', url.origin));
  } catch (error) {
    console.error('MICROSOFT CALLBACK ERROR:', error);
    redirectUrl.searchParams.set('error', 'No fue posible completar el inicio de sesión Microsoft.');
    return Response.redirect(redirectUrl);
  }
}
