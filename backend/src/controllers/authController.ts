import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password sono obbligatori' });
  }
  try {
    const { rows } = await query(
      'SELECT * FROM users WHERE (username = $1 OR email = $1) AND is_active = true',
      [username]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    await query(
      `INSERT INTO activity_logs (user_id, action, ip_address, user_agent)
       VALUES ($1, 'LOGIN', $2, $3)`,
      [user.id, req.ip, req.headers['user-agent']]
    );
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (err) {
    logger.error('Errore login:', err);
    res.status(500).json({ error: 'Errore durante il login' });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    if (req.user?.id) {
      await query(
        `INSERT INTO activity_logs (user_id, action, ip_address)
         VALUES ($1, 'LOGOUT', $2)`,
        [req.user.id, req.ip]
      );
    }
    res.json({ message: 'Logout effettuato' });
  } catch (err) {
    logger.error('Errore logout:', err);
    res.status(500).json({ error: 'Errore durante il logout' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const { rows } = await query(
      'SELECT id, username, email, role, first_name, last_name, last_login, created_at FROM users WHERE id = $1',
      [req.user?.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(rows[0]);
  } catch (err) {
    logger.error('Errore getMe:', err);
    res.status(500).json({ error: 'Errore recupero profilo' });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Password corrente e nuova sono obbligatorie' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ error: 'La nuova password deve essere di almeno 8 caratteri' });
  }
  try {
    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user?.id]);
    if (!rows[0] || !(await bcrypt.compare(current_password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Password corrente non valida' });
    }
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user?.id]);
    res.json({ message: 'Password aggiornata' });
  } catch (err) {
    logger.error('Errore cambio password:', err);
    res.status(500).json({ error: 'Errore aggiornamento password' });
  }
}
