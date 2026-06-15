import { Router } from 'express';
import {
  getEvents, getEvent, createEvent, updateEvent, deleteEvent,
  getUpcoming, getCollaborators
} from '../controllers/eventController';
import { exportEventsExcel } from '../services/exportService';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/upcoming', getUpcoming);
router.get('/collaborators', getCollaborators);
router.get('/export', (req, res) => exportEventsExcel(res, req.query as Record<string, string>));
router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
