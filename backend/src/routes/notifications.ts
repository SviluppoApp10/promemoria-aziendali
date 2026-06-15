import { Router } from 'express';
import { getNotifications, markRead, markAllRead, getEmailLogs } from '../controllers/notificationController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);
router.get('/email-logs', requireAdmin, getEmailLogs);

export default router;
