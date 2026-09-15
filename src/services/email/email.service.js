import nodemailer from 'nodemailer';
import { mailConfig } from '@/config/mail';
import { query } from '@/lib/db/mysql';

function getTransporter() {
  return nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: false,
    requireTLS: true,
    auth: { user: mailConfig.user, pass: mailConfig.password },
  });
}

const stateLabels = {
  created: 'creada',
  leader_pending: 'pendiente de aprobación del líder',
  hr_pending: 'pendiente de revisión de Recursos Humanos',
  leader_rejected: 'rechazada por el líder',
  hr_rejected: 'rechazada por Recursos Humanos',
  completed: 'finalizada',
  expired: 'vencida',
  cancelled: 'cancelada',
};

async function recipientsFor(request, requesterOnly = false) {
  const requesterEmail = String(request.form_email || '').trim().toLowerCase();
  if (requesterOnly) {
    return requesterEmail ? [{ email: requesterEmail, internal: false }] : [];
  }

  const hrRows = await query(
    `SELECT email
     FROM users
      WHERE LOWER(role) IN ('hr', 'rrhh') AND email IS NOT NULL`
  );
  const hrEmails = hrRows.map((row) => row.email);
  const internalRecipients = [...new Set([request.leader_email, ...hrEmails]
    .map((email) => String(email || '').trim().toLowerCase())
    .filter((email) => email && email !== mailConfig.from.toLowerCase()))];
  return [...new Set([...internalRecipients, requesterEmail].filter(Boolean))]
    .map((email) => ({ email, internal: internalRecipients.includes(email) }));
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

function buildInternalHtml(request, state, observation) {
  return `<div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:32px;color:#243447;">
    <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #dce3ec;border-radius:12px;overflow:hidden;">
      <div style="background:#183b56;color:#fff;padding:24px 28px;">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.8;">Portal de novedades</div>
        <h1 style="margin:8px 0 0;font-size:24px;">Novedad ${escapeHtml(state)}</h1>
      </div>
      <div style="padding:26px 28px;">
        <p style="font-size:16px;margin-top:0;">Se registró una actualización para <strong>${escapeHtml(request.form_full_name || 'un colaborador')}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:9px 0;color:#64748b;">Tipo</td><td style="padding:9px 0;font-weight:600;">${escapeHtml(request.leave_class || 'Novedad')}</td></tr>
          <tr><td style="padding:9px 0;color:#64748b;">Estado</td><td style="padding:9px 0;font-weight:600;">${escapeHtml(state)}</td></tr>
          <tr><td style="padding:9px 0;color:#64748b;">Fecha de registro</td><td style="padding:9px 0;">${escapeHtml(request.created_at)}</td></tr>
        </table>
        ${observation}
        <a href="http://localhost:3000/login" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:13px 22px;border-radius:7px;font-weight:600;">Ingresar al portal</a>
      </div>
      <div style="padding:16px 28px;background:#f8fafc;color:#64748b;font-size:12px;">Correo automático del sistema de novedades.</div>
    </div>
  </div>`;
}

export async function sendLeaveRequestNotification(request, event = 'updated') {
  if (!mailConfig.user || !mailConfig.password) {
    console.warn('Notificación de novedad omitida: faltan destinatarios o credenciales de correo.');
    return { skipped: true };
  }

  const state = stateLabels[request.state_code] || request.state_name || request.status || 'actualizada';
  const requesterOnly = event !== 'created';
  const subject = event === 'created'
    ? `Nueva novedad pendiente de aprobación: ${request.form_full_name}`
    : `Novedad ${state}${requesterOnly ? ` (${event.startsWith('leader_') ? 'decisión del líder' : 'decisión de RR. HH.'})` : ''}: ${request.form_full_name}`;
  const observation = request.rejection_observation
    ? `<p style="padding:12px;background:#fff7ed;border-left:4px solid #f59e0b;"><strong>Observación:</strong> ${escapeHtml(request.rejection_observation)}</p>`
    : '';

  try {
    const recipients = await recipientsFor(request, requesterOnly);
    if (!recipients.length) {
      console.warn('Notificación de novedad omitida: no hay destinatarios válidos.');
      return { skipped: true };
    }

    const results = await Promise.all(recipients.map(({ email, internal }) => getTransporter().sendMail({
      from: `${mailConfig.alias} <${mailConfig.from}>`,
      to: email,
      subject,
      html: internal
        ? buildInternalHtml(request, state, observation)
        : `<p>La novedad de <strong>${escapeHtml(request.form_full_name || 'un colaborador')}</strong> fue ${escapeHtml(state)}.</p>
          <p><strong>Tipo:</strong> ${escapeHtml(request.leave_class || 'Novedad')}<br>
          <strong>Estado:</strong> ${escapeHtml(state)}</p>${observation}
          <p>Este es un correo automático. Por favor, no responda a este mensaje.</p>`,
    })));
    return { sent: true, messageId: results[0]?.messageId };
  } catch (error) {
    console.error('Error al enviar notificación de novedad:', error.message);
    return { sent: false, error: error.message };
  }
}

export const emailService = {
  send: sendLeaveRequestNotification,
};

export default emailService;
