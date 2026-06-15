import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error(`${req.method} ${req.path} - ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Errore interno del server', message: err.message });
}
