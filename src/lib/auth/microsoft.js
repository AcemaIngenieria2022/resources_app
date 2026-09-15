import crypto from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';
import { query } from '@/lib/db/mysql';

const tenantId = process.env.MICROSOFT_TENANT_ID;
const clientId = process.env.MICROSOFT_CLIENT_ID;
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
const redirectUri = process.env.MICROSOFT_REDIRECT_URI;
const sessionSecret = new TextEncoder().encode(process.env.AUTH_SESSION_SECRET || process.env.JWT_SECRET || 'development-secret');
const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
const jwks = tenantId
  ? createRemoteJWKSet(new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`))
  : null;

export const microsoftSessionCookie = 'resources_auth_session';
export const microsoftStateCookie = 'resources_microsoft_state';

export function assertMicrosoftConfig() {
  if (!tenantId || !clientId || !clientSecret || !redirectUri) {
    throw new Error('La configuración de Microsoft 365 está incompleta.');
  }
}

export function createOAuthState() {
  return crypto.randomBytes(32).toString('hex');
}

export function getMicrosoftAuthorizationUrl(state) {
  assertMicrosoftConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'openid profile email User.Read',
    state,
  });
  return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`;
}

export async function exchangeCodeForToken(code) {
  assertMicrosoftConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: 'openid profile email User.Read',
  });
  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok || !payload.id_token) throw new Error(payload.error_description || 'Microsoft no devolvió un token válido.');
  return payload;
}

export async function getMicrosoftProfile(accessToken) {
  if (!accessToken) return {};
  const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=id,mail,userPrincipalName,displayName', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  if (!response.ok) return {};
  return response.json();
}

export async function validateMicrosoftIdToken(idToken) {
  assertMicrosoftConfig();
  const { payload } = await jwtVerify(idToken, jwks, { issuer, audience: clientId });
  return payload;
}

export async function findLinkedUser(claims) {
  const oid = String(claims.oid || claims.sub || '').trim();
  const email = String(claims.preferred_username || claims.email || claims.upn || claims.unique_name || '').trim().toLowerCase();
  if (!oid && !email) return null;

  const rows = await query(
            `SELECT e.id AS employee_id,
              e.corporate_email AS email,
          e.microsoft_oid, e.personName, e.active,
          r.name AS role, r.description AS role_description,
              NULL AS first_name, NULL AS last_name
         FROM employees e
         LEFT JOIN roles r ON r.id = e.role_id
             WHERE e.active = 1
               AND e.corporate_email IS NOT NULL
               AND (e.microsoft_oid = ? OR LOWER(e.corporate_email) = ?)
     LIMIT 1`,
    [oid || null, email]
  );
  const user = rows?.[0];
  if (!user) return null;
  if (!user.active || !user.email || !['leader', 'approver', 'hr', 'rrhh'].includes(String(user.role || '').toLowerCase())) {
    return { rejected: 'inactive_role' };
  }

  if (oid && user.microsoft_oid !== oid) {
    await query(
      `UPDATE employees SET microsoft_oid = ?, auth_provider = 'microsoft' WHERE id = ?`,
      [oid, user.employee_id]
    );
  }
  return {
    id: Number(user.employee_id),
    employeeId: Number(user.employee_id),
    legacyUserId: null,
    email: user.email,
    role: user.role,
    role_description: user.role_description,
    first_name: user.first_name || user.personName?.split(' ')[0] || '',
    last_name: user.last_name || '',
    microsoft_oid: oid || user.microsoft_oid,
  };
}

export async function createSessionToken(user) {
  return new SignJWT({
    email: user.email,
    employeeId: user.employeeId,
    legacyUserId: user.legacyUserId,
    role: user.role,
    roleDescription: user.role_description,
    firstName: user.first_name,
    lastName: user.last_name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(sessionSecret);
}

export async function verifySessionToken(token) {
  const { payload } = await jwtVerify(token, sessionSecret);
  return {
    id: Number(payload.sub),
    employeeId: Number(payload.employeeId || payload.sub),
    legacyUserId: payload.legacyUserId ? Number(payload.legacyUserId) : null,
    email: payload.email,
    role: payload.role,
    roleDescription: payload.roleDescription,
    firstName: payload.firstName,
    lastName: payload.lastName,
  };
}
