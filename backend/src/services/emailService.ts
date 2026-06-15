import nodemailer from 'nodemailer';
import { query } from '../config/database';
import logger from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function buildReminderTemplate(event: {
  collaborator_name: string;
  title: string;
  description?: string;
  event_date: string;
  event_time: string;
}): string {
  const eventDate = new Date(`${event.event_date}T${event.event_time}`);
  const formatted = eventDate.toLocaleDateString('it-IT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formattedTime = event.event_time.substring(0, 5);

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promemoria Evento</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; color: #333; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 32px 40px; text-align: center; }
    .header h1 { font-size: 26px; font-weight: 600; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .body { padding: 40px; }
    .greeting { font-size: 16px; margin-bottom: 24px; color: #555; }
    .event-card { background: #f0f7ff; border-left: 4px solid #1976d2; border-radius: 8px; padding: 24px; margin: 20px 0; }
    .event-title { font-size: 20px; font-weight: 700; color: #1976d2; margin-bottom: 16px; }
    .event-detail { display: flex; align-items: center; margin-bottom: 10px; font-size: 14px; color: #444; }
    .event-detail .label { font-weight: 600; min-width: 80px; color: #1976d2; }
    .description { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; color: #555; line-height: 1.6; }
    .footer { background: #f5f7fa; padding: 24px 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; }
    .badge { display: inline-block; background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Promemoria Evento</h1>
      <p>Promemoria Aziendali — Sistema di Gestione</p>
    </div>
    <div class="body">
      <p class="greeting">Gentile <strong>${event.collaborator_name}</strong>,</p>
      <p style="color:#555; margin-bottom:20px;">Ti ricordiamo che hai un evento in programma:</p>
      <div class="event-card">
        <div class="event-title">${event.title}</div>
        <div class="event-detail">
          <span class="label">📅 Data:</span>
          <span>${formatted}</span>
        </div>
        <div class="event-detail">
          <span class="label">🕐 Ora:</span>
          <span>${formattedTime}</span>
        </div>
      </div>
      ${event.description ? `
      <div class="description">
        <strong>📝 Note:</strong><br>
        ${event.description}
      </div>` : ''}
      <p style="color:#777; font-size:13px; margin-top:20px;">Questo è un messaggio automatico inviato dal sistema Promemoria Aziendali.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Promemoria Aziendali — Tutti i diritti riservati</p>
      <span class="badge">Messaggio automatico</span>
    </div>
  </div>
</body>
</html>`;
}

export async function sendReminderEmail(event: {
  id: number;
  collaborator_name: string;
  collaborator_email: string;
  title: string;
  description?: string;
  event_date: string;
  event_time: string;
}) {
  const subject = `🔔 Promemoria: ${event.title}`;
  const html = buildReminderTemplate(event);

  let status = 'sent';
  let errorMessage: string | undefined;

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Promemoria Aziendali'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: event.collaborator_email,
      subject,
      html,
    });
    logger.info(`Email promemoria inviata a ${event.collaborator_email} per evento #${event.id}`);
  } catch (err: unknown) {
    status = 'failed';
    errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
    logger.error(`Errore invio email per evento #${event.id}:`, err);
  }

  await query(
    `INSERT INTO email_logs (event_id, recipient_email, recipient_name, subject, body, status, error_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [event.id, event.collaborator_email, event.collaborator_name, subject, html, status, errorMessage || null]
  );

  return status === 'sent';
}
