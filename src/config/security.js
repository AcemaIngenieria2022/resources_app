export const securityConfig = {
  jwtSecret: process.env.JWT_SECRET || 'development-secret',
};

export default securityConfig;
