import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { query } from '../config/database';
import logger from '../utils/logger';

export function logActivity(action: string, entityType?: string) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (req.user?.id) {
        await query(
          `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            req.user.id,
            action,
            entityType || null,
            req.params.id ? parseInt(req.params.id) : null,
            JSON.stringify({ body: req.body, query: req.query }),
            req.ip,
            req.headers['user-agent'],
          ]
        );
      }
    } catch (err) {
      logger.warn('Errore log attività:', err);
    }
    next();
  };
}
