export const mailConfig = {
  provider: process.env.MAIL_PROVIDER || 'smtp',
  from: process.env.MAIL_FROM || 'no-reply@example.com',
};

export default mailConfig;
