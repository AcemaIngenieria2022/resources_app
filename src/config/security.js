// Configuración de seguridad para la firma y validación de JWTs.
export const securityConfig = {
  jwtSecret: process.env.JWT_SECRET || 'development-secret',
};

export default securityConfig;
