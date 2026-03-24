import { Router } from 'express';
import { getRoles, addRole, updateRole, deleteRole } from '../controllers/role.controller.js';

const router = Router();

router.get('/', getRoles);
router.post('/', addRole);
router.patch('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;
