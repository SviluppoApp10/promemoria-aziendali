import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const { rows } = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user?.id]
    );
    const unread = rows.filter(n => !n.is_read).length;
    res.json({ notifications: rows, unread });
  } catch (err) {
    logger.error('Errore getNotifications:', err);
    res.status(500).json({ error: 'Errore recupero notifiche' });
  }
}

export async function markRead(req: AuthRequest, res: Response) {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user?.id]
    );
    res.json({ message: 'Notifica letta' });
  } catch (err) {
    logger.error('Errore markRead:', err);
    res.status(500).json({ error: 'Errore aggiornamento notifica' });
  }
}

export async function markAllRead(req: AuthRequest, res: Response) {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user?.id]
    );
    res.json({ message: 'Tutte le notifiche lette' });
  } catch (err) {
    logger.error('Errore markAllRead:', err);
    res.status(500).json({ error: 'Errore aggiornamento notifiche' });
  }
}

export async function getEmailLogs(req: AuthRequest, res: Response) {
  try {
    const { page = '1', limit = '20', status } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = status ? `WHERE el.status = '${status}'` : '';
    const { rows } = await query(
      `SELECT el.*, e.title as event_title, e.collaborator_name
       FROM email_logs el
       LEFT JOIN events e ON el.event_id = e.id
       ${conditions}
       ORDER BY el.sent_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );
    const countRes = await query(`SELECT COUNT(*) FROM email_logs el ${conditions}`);
    res.json({ logs: rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    logger.error('Errore getEmailLogs:', err);
    res.status(500).json({ error: 'Errore recupero log email' });
  }
}
