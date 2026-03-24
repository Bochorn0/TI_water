import { Router } from 'express';
import { getActiveUsers, updateUser, deleteUser, addUser } from '../controllers/user.controller.js';

const router = Router();

router.get('/', getActiveUsers);
router.patch('/:id', updateUser);
router.post('/', addUser);
router.delete('/:id', deleteUser);

export default router;
