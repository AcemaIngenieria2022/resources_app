import { cookies } from 'next/headers';
import { microsoftSessionCookie } from '@/lib/auth/microsoft';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(microsoftSessionCookie);
  return Response.json({ success: true });
}
