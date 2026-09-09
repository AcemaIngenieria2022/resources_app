// Helpers para el manejo seguro de contraseñas usando scrypt en la capa de seguridad.
import crypto from 'crypto';

const DEFAULT_SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keylen: 64,
};

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, DEFAULT_SCRYPT_PARAMS.keylen, {
    N: DEFAULT_SCRYPT_PARAMS.N,
    r: DEFAULT_SCRYPT_PARAMS.r,
    p: DEFAULT_SCRYPT_PARAMS.p,
  });

  return `scrypt:${DEFAULT_SCRYPT_PARAMS.N}:${DEFAULT_SCRYPT_PARAMS.r}:${DEFAULT_SCRYPT_PARAMS.p}$${salt}$${derivedKey.toString('hex')}`;
}

export function verifyPassword(password, storedPassword) {
  if (!storedPassword) {
    return false;
  }

  if (!storedPassword.startsWith('scrypt:')) {
    return password === storedPassword;
  }

  const [header, salt, hash] = storedPassword.split('$');
  const [, N, r, p] = header.split(':');

  if (!salt || !hash || !N || !r || !p) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, DEFAULT_SCRYPT_PARAMS.keylen, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });

  return derivedKey.toString('hex') === hash;
}

export default {
  hashPassword,
  verifyPassword,
};
