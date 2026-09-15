/**
 * Configuración centralizada para el sistema de reportes
 * Contiene credenciales de email y base de datos
 */

require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });

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
    password: process.env.REPORTS_SMTP_PASSWORD || '',
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

  // La tabla attlog reside en una base de datos independiente.
  attlogDatabase: {
    host: process.env.ATTLOG_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port: process.env.ATTLOG_DB_PORT || process.env.DB_PORT || 3306,
    user: process.env.ATTLOG_DB_USER || process.env.DB_USER || 'root',
    password: process.env.ATTLOG_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '',
    database: process.env.ATTLOG_DB_NAME || process.env.DB_NAME || 'thirdpartydb',
  },

  // ============================
  // Configuración de reportes
  // ============================
  reports: {
    output_dir: process.env.REPORTS_OUTPUT_DIR || './reports',
    keep_files: process.env.REPORTS_KEEP_FILES === 'true' || true, // Mantener archivos generados
    send_excel: process.env.REPORTS_SEND_EXCEL === 'true',
    schedule_time: process.env.REPORTS_SCHEDULE_TIME || '0 6 * * *', // 6:00 AM diario
  },
};
