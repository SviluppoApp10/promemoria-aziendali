import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser, resetPassword } from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', requireAdmin, getUsers);
router.get('/:id', requireAdmin, getUser);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);
router.post('/:id/reset-password', requireAdmin, resetPassword);

export default router;
