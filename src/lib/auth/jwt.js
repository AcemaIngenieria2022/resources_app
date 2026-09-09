// Helper de autenticación para crear y verificar tokens simples en desarrollo.
export const createToken = (payload) => ({ token: `token:${JSON.stringify(payload)}` });
// Verifica si un token tiene el formato esperado por la implementación actual.
export const verifyToken = (token) => token?.startsWith('token:');

export default { createToken, verifyToken };
