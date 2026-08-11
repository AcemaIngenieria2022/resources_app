export const createToken = (payload) => ({ token: `token:${JSON.stringify(payload)}` });
export const verifyToken = (token) => token?.startsWith('token:');

export default { createToken, verifyToken };
