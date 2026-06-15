import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../utils/logger';

export async function getDashboardStats(_req: Request, res: Response) {
  try {
    const [events, reminders, users, upcoming, emailLogs, byCollaborator, byMonth] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(CASE WHEN event_date >= CURRENT_DATE THEN 1 END) as future FROM events'),
      query('SELECT COUNT(*) as total, COUNT(CASE WHEN reminder_sent = true THEN 1 END) as sent, COUNT(CASE WHEN reminder_sent = false AND reminder_datetime IS NOT NULL THEN 1 END) as pending FROM events'),
      query('SELECT COUNT(*) as total, COUNT(CASE WHEN is_active = true THEN 1 END) as active FROM users'),
      query(`SELECT COUNT(*) FROM events WHERE event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '7 days'`),
      query('SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'sent\' THEN 1 END) as sent FROM email_logs'),
      query(`
        SELECT collaborator_name, collaborator_email, COUNT(*) as event_count
        FROM events
        GROUP BY collaborator_name, collaborator_email
        ORDER BY event_count DESC LIMIT 10
      `),
      query(`
        SELECT TO_CHAR(event_date, 'YYYY-MM') as month, COUNT(*) as count
        FROM events
        WHERE event_date >= CURRENT_DATE - interval '12 months'
        GROUP BY month ORDER BY month
      `),
    ]);

    res.json({
      events: {
        total: parseInt(events.rows[0].total),
        future: parseInt(events.rows[0].future),
      },
      reminders: {
        total: parseInt(reminders.rows[0].total),
        sent: parseInt(reminders.rows[0].sent),
        pending: parseInt(reminders.rows[0].pending),
      },
      users: {
        total: parseInt(users.rows[0].total),
        active: parseInt(users.rows[0].active),
      },
      upcoming_7_days: parseInt(upcoming.rows[0].count),
      email_logs: {
        total: parseInt(emailLogs.rows[0].total),
        sent: parseInt(emailLogs.rows[0].sent),
      },
      top_collaborators: byCollaborator.rows,
      events_by_month: byMonth.rows,
    });
  } catch (err) {
    logger.error('Errore getDashboardStats:', err);
    res.status(500).json({ error: 'Errore recupero statistiche' });
  }
}
