/**
 * Configuración centralizada para el sistema de reportes
 * Contiene credenciales de email y base de datos
 */

// node scripts/reports/send.js 2026-09-01

module.exports = {
  // ============================
  // Configuración de correo
  // ============================
  mail: {
    from_email: 'InformesTI@acemaingenieria.com',
    alias_name: 'Operaciones TI Acema Ingenieria',
    to_email: [
      'santiago.montoya@grupovanta.com.co',
      
    ],
    cc_email: ['prueba20@acemaingenieria.com'],
    smtp_server: 'smtp-mail.outlook.com',
    smtp_port: 587,
    password: 'zjgqknmyltbhhnbb',
  },

  // ============================
  // Configuración de Base de Datos
  // ============================
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'thirdpartydb',
  },

  // ============================
  // Configuración de reportes
  // ============================
  reports: {
    output_dir: process.env.REPORTS_OUTPUT_DIR || './reports',
    keep_files: process.env.REPORTS_KEEP_FILES === 'true' || true, // Mantener archivos generados
    schedule_time: process.env.REPORTS_SCHEDULE_TIME || '0 6 * * *', // 6:00 AM diario
  },
};
