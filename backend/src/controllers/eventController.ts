import { Request, Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const EVENT_FIELDS = `
  e.id, e.collaborator_name, e.collaborator_email, e.title, e.description,
  e.event_date, e.event_time, e.reminder_datetime, e.reminder_sent, e.reminder_sent_at,
  e.created_by, e.created_at, e.updated_at,
  u.username as creator_username, u.first_name as creator_first_name, u.last_name as creator_last_name
`;

export async function getEvents(req: Request, res: Response) {
  try {
    const {
      search, collaborator_email, start_date, end_date,
      reminder_sent, page = '1', limit = '50'
    } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (search) {
      conditions.push(`(e.title ILIKE $${p} OR e.description ILIKE $${p} OR e.collaborator_name ILIKE $${p})`);
      params.push(`%${search}%`); p++;
    }
    if (collaborator_email) {
      conditions.push(`e.collaborator_email = $${p}`);
      params.push(collaborator_email); p++;
    }
    if (start_date) {
      conditions.push(`e.event_date >= $${p}`);
      params.push(start_date); p++;
    }
    if (end_date) {
      conditions.push(`e.event_date <= $${p}`);
      params.push(end_date); p++;
    }
    if (reminder_sent !== undefined) {
      conditions.push(`e.reminder_sent = $${p}`);
      params.push(reminder_sent === 'true'); p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const countRes = await query(
      `SELECT COUNT(*) FROM events e ${where}`, params
    );
    const total = parseInt(countRes.rows[0].count);

    params.push(parseInt(limit), offset);
    const { rows } = await query(
      `SELECT ${EVENT_FIELDS}
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       ${where}
       ORDER BY e.event_date DESC, e.event_time DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      params
    );

    res.json({ events: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    logger.error('Errore getEvents:', err);
    res.status(500).json({ error: 'Errore recupero eventi' });
  }
}

export async function getEvent(req: Request, res: Response) {
  try {
    const { rows } = await query(
      `SELECT ${EVENT_FIELDS}
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Evento non trovato' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('Errore getEvent:', err);
    res.status(500).json({ error: 'Errore recupero evento' });
  }
}

export async function createEvent(req: AuthRequest, res: Response) {
  const {
    collaborator_name, collaborator_email, title, description,
    event_date, event_time, reminder_datetime
  } = req.body;

  if (!collaborator_name || !collaborator_email || !title || !event_date || !event_time) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  }

  try {
    const { rows } = await query(
      `INSERT INTO events
         (collaborator_name, collaborator_email, title, description, event_date, event_time, reminder_datetime, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [collaborator_name, collaborator_email, title, description, event_date, event_time, reminder_datetime || null, req.user?.id]
    );

    // Notifica interna
    await query(
      `INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
       VALUES ($1, $2, $3, 'info', 'event', $4)`,
      [req.user?.id, 'Evento creato', `Nuovo evento: ${title} per ${collaborator_name}`, rows[0].id]
    );

    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, 'CREATE_EVENT', 'event', $2)`,
      [req.user?.id, rows[0].id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    logger.error('Errore createEvent:', err);
    res.status(500).json({ error: 'Errore creazione evento' });
  }
}

export async function updateEvent(req: AuthRequest, res: Response) {
  const {
    collaborator_name, collaborator_email, title, description,
    event_date, event_time, reminder_datetime, reminder_sent
  } = req.body;

  try {
    const { rows } = await query(
      `UPDATE events SET
         collaborator_name = COALESCE($1, collaborator_name),
         collaborator_email = COALESCE($2, collaborator_email),
         title = COALESCE($3, title),
         description = COALESCE($4, description),
         event_date = COALESCE($5, event_date),
         event_time = COALESCE($6, event_time),
         reminder_datetime = COALESCE($7, reminder_datetime),
         reminder_sent = COALESCE($8, reminder_sent)
       WHERE id = $9
       RETURNING *`,
      [collaborator_name, collaborator_email, title, description, event_date, event_time, reminder_datetime, reminder_sent, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Evento non trovato' });

    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, 'UPDATE_EVENT', 'event', $2)`,
      [req.user?.id, rows[0].id]
    );

    res.json(rows[0]);
  } catch (err) {
    logger.error('Errore updateEvent:', err);
    res.status(500).json({ error: 'Errore aggiornamento evento' });
  }
}

export async function deleteEvent(req: AuthRequest, res: Response) {
  try {
    const { rows } = await query('DELETE FROM events WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Evento non trovato' });

    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, 'DELETE_EVENT', 'event', $2)`,
      [req.user?.id, req.params.id]
    );

    res.json({ message: 'Evento eliminato' });
  } catch (err) {
    logger.error('Errore deleteEvent:', err);
    res.status(500).json({ error: 'Errore eliminazione evento' });
  }
}

export async function getUpcoming(req: Request, res: Response) {
  try {
    const days = parseInt((req.query.days as string) || '7');
    const { rows } = await query(
      `SELECT ${EVENT_FIELDS}
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $1::interval
       ORDER BY e.event_date ASC, e.event_time ASC
       LIMIT 20`,
      [`${days} days`]
    );
    res.json(rows);
  } catch (err) {
    logger.error('Errore getUpcoming:', err);
    res.status(500).json({ error: 'Errore recupero eventi imminenti' });
  }
}

export async function getCollaborators(_req: Request, res: Response) {
  try {
    const { rows } = await query(
      `SELECT DISTINCT collaborator_name, collaborator_email
       FROM events
       ORDER BY collaborator_name`
    );
    res.json(rows);
  } catch (err) {
    logger.error('Errore getCollaborators:', err);
    res.status(500).json({ error: 'Errore recupero collaboratori' });
  }
}
