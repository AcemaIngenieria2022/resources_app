/**
 * Servicio de email para enviar reportes
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require('../config');

function writeDeliveryLog(entry) {
  const outputDir = config.reports.output_dir;
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const logPath = path.join(outputDir, 'email-sends.log');
  fs.appendFileSync(logPath, `${JSON.stringify({ timestamp: new Date().toISOString(), ...entry })}\n`, 'utf8');
}

/**
 * Crea un transportador de email configurado
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: config.mail.smtp_server,
    port: config.mail.smtp_port,
    secure: false,
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: config.mail.from_email,
      pass: config.mail.password,
    },
  });
}

/**
 * Envía email con los archivos de reporte
 * @param {string} pdfPath - Ruta del archivo PDF
 * @param {string} excelPath - Ruta del archivo Excel
 * @param {string} date - Fecha del reporte (YYYY-MM-DD)
 */
async function sendReport(pdfPath, excelPath, date) {
  const transporter = createTransporter();

  const mailOptions = {
    from: `${config.mail.alias_name} <${config.mail.from_email}>`,
    to: config.mail.to_email.join(', '),
    cc: config.mail.cc_email.join(', '),
    subject: `Resumen de Asistencia Diaria [Medellín] - ${new Date(date).toLocaleDateString('es-CO')}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p>Buenos días, cordial saludo.</p>
          
          <p style="margin-top: 15px;">Por medio del presente, remito los detalles de ingresos y salidas de la sede de Medellín, correspondientes a la jornada del <strong>${new Date(date).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
          
          <div style="background-color: #f0f7ff; border-left: 4px solid #36BBA7; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>📎 Archivos adjuntos:</strong>
            <ul style="margin-top: 10px; margin-bottom: 0;">
              <li>summary-${date}.pdf</li>
              <li>summary-${date}.xlsx</li>
            </ul>
          </div>
          
          <p style="margin-top: 20px;">Agradecemos de antemano su revisión y quedamos a su disposición para cualquier aclaración que sea requerida.</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #888; margin-top: 20px;">
            <em>Este es un correo automático generado por el sistema de asistencia de Acema Ingeniería. 
            Por favor, no responda a este correo.</em>
          </p>
          <p style="font-size: 11px; color: #aaa; margin-top: 5px;">
            Generado: ${new Date().toLocaleString('es-CO')}
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `summary-${date}.pdf`,
        path: pdfPath,
      },
      {
        filename: `summary-${date}.xlsx`,
        path: excelPath,
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    writeDeliveryLog({
      status: 'sent',
      reportDate: date,
      to: config.mail.to_email,
      cc: config.mail.cc_email,
      attachments: [pdfPath, excelPath],
      messageId: info.messageId,
    });
    console.log('✅ Email enviado exitosamente');
    console.log(`   Para: ${config.mail.to_email.join(', ')}`);
    console.log(`   CC: ${config.mail.cc_email.join(', ')}`);
    console.log(`   MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    writeDeliveryLog({
      status: 'error',
      reportDate: date,
      to: config.mail.to_email,
      cc: config.mail.cc_email,
      attachments: [pdfPath, excelPath],
      error: error.message,
    });
    console.error('❌ Error al enviar email:', error.message);
    throw error;
  }
}

module.exports = {
  sendReport,
  createTransporter,
};
