import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import logger from '../utils/logger';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/download', async (_req: AuthRequest, res: Response) => {
  try {
    const [events, users, emailLogs] = await Promise.all([
      query('SELECT * FROM events ORDER BY id'),
      query('SELECT id, username, email, role, first_name, last_name, is_active, created_at FROM users ORDER BY id'),
      query('SELECT * FROM email_logs ORDER BY id'),
    ]);

    const backup = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      data: {
        events: events.rows,
        users: users.rows,
        email_logs: emailLogs.rows,
      },
    };

    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(backup);
  } catch (err) {
    logger.error('Errore backup:', err);
    res.status(500).json({ error: 'Errore generazione backup' });
  }
});

export default router;
