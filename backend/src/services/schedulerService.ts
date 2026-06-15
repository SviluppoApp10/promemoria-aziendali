import cron from 'node-cron';
import { query } from '../config/database';
import { sendReminderEmail } from './emailService';
import logger from '../utils/logger';

export function initScheduler() {
  // Ogni minuto controlla promemoria da inviare
  cron.schedule('* * * * *', async () => {
    try {
      const { rows } = await query(
        `SELECT * FROM events
         WHERE reminder_sent = false
           AND reminder_datetime IS NOT NULL
           AND reminder_datetime <= NOW()
         LIMIT 50`
      );

      if (rows.length === 0) return;

      logger.info(`Scheduler: trovati ${rows.length} promemoria da inviare`);

      for (const event of rows) {
        const sent = await sendReminderEmail(event);
        if (sent) {
          await query(
            'UPDATE events SET reminder_sent = true, reminder_sent_at = NOW() WHERE id = $1',
            [event.id]
          );
          // Notifica interna a tutti gli admin
          await query(
            `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
             SELECT id, 'Promemoria inviato', $1, 'success', 'event', $2
             FROM users WHERE role = 'admin' AND is_active = true`,
            [`Promemoria inviato a ${event.collaborator_email} per "${event.title}"`, event.id]
          );
        }
      }
    } catch (err) {
      logger.error('Errore scheduler promemoria:', err);
    }
  });

  logger.info('Scheduler promemoria avviato (ogni minuto)');
}
