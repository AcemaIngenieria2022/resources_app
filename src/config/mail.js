// Configuración del proveedor de correo para notificaciones y envíos del sistema.
export const mailConfig = {
  provider: process.env.MAIL_PROVIDER || 'smtp',
  from: process.env.MAIL_FROM || process.env.REPORTS_MAIL_FROM || 'InformesTI@acemaingenieria.com',
  alias: process.env.MAIL_ALIAS || 'Sistema de novedades',
  host: process.env.MAIL_HOST || 'smtp-mail.outlook.com',
  port: Number(process.env.MAIL_PORT || 587),
  user: process.env.MAIL_USER || process.env.REPORTS_MAIL_FROM || 'InformesTI@acemaingenieria.com',
  password: process.env.MAIL_PASSWORD || process.env.REPORTS_SMTP_PASSWORD || '',
};

export default mailConfig;
