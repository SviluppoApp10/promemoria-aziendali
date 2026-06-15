import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export async function getUsers(_req: Request, res: Response) {
  try {
    const { rows } = await query(
      `SELECT id, username, email, role, first_name, last_name, is_active, last_login, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    logger.error('Errore getUsers:', err);
    res.status(500).json({ error: 'Errore recupero utenti' });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const { rows } = await query(
      `SELECT id, username, email, role, first_name, last_name, is_active, last_login, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('Errore getUser:', err);
    res.status(500).json({ error: 'Errore recupero utente' });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  const { username, email, password, role, first_name, last_name } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email e password sono obbligatori' });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash, role, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role, first_name, last_name, created_at`,
      [username, email, hash, role || 'user', first_name, last_name]
    );
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
       VALUES ($1, 'CREATE_USER', 'user', $2)`,
      [req.user?.id, rows[0].id]
    );
    res.status(201).json(rows[0]);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'Username o email già esistente' });
    }
    logger.error('Errore createUser:', err);
    res.status(500).json({ error: 'Errore creazione utente' });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  const { email, role, first_name, last_name, is_active } = req.body;
  try {
    const { rows } = await query(
      `UPDATE users SET email = COALESCE($1, email), role = COALESCE($2, role),
       first_name = COALESCE($3, first_name), last_name = COALESCE($4, last_name),
       is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING id, username, email, role, first_name, last_name, is_active`,
      [email, role, first_name, last_name, is_active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('Errore updateUser:', err);
    res.status(500).json({ error: 'Errore aggiornamento utente' });
  }
}

export async function deleteUser(req: AuthRequest, res: Response) {
  if (req.params.id === String(req.user?.id)) {
    return res.status(400).json({ error: 'Non puoi eliminare il tuo account' });
  }
  try {
    await query('UPDATE users SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Utente disabilitato' });
  } catch (err) {
    logger.error('Errore deleteUser:', err);
    res.status(500).json({ error: 'Errore eliminazione utente' });
  }
}

export async function resetPassword(req: AuthRequest, res: Response) {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 8) {
    return res.status(400).json({ error: 'Password non valida (minimo 8 caratteri)' });
  }
  try {
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
    res.json({ message: 'Password reimpostata' });
  } catch (err) {
    logger.error('Errore resetPassword:', err);
    res.status(500).json({ error: 'Errore reimpostazione password' });
  }
}
