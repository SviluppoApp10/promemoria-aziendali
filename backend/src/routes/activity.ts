import { Router, Response } from 'express';
import { query } from '../config/database';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', user_id, action } = req.query as Record<string, string>;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (user_id) { conditions.push(`al.user_id = $${p}`); params.push(parseInt(user_id)); p++; }
    if (action) { conditions.push(`al.action ILIKE $${p}`); params.push(`%${action}%`); p++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit), offset);

    const { rows } = await query(
      `SELECT al.*, u.username, u.first_name, u.last_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      params
    );

    const countParams = conditions.length ? params.slice(0, p - 1) : [];
    const countRes = await query(
      `SELECT COUNT(*) FROM activity_logs al ${where}`, countParams
    );

    res.json({ logs: rows, total: parseInt(countRes.rows[0].count) });
  } catch (err) {
    logger.error('Errore activity logs:', err);
    res.status(500).json({ error: 'Errore recupero log attività' });
  }
});

export default router;
