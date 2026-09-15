import { cookies } from 'next/headers';
import { microsoftSessionCookie, verifySessionToken } from '@/lib/auth/microsoft';

export async function GET() {
  const token = (await cookies()).get(microsoftSessionCookie)?.value;
  if (!token) return Response.json({ authenticated: false }, { status: 401 });

  try {
    const user = await verifySessionToken(token);
    return Response.json({ authenticated: true, user });
  } catch {
    return Response.json({ authenticated: false }, { status: 401 });
  }
}
