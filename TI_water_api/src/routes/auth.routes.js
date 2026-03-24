import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', authenticate, (_req, res) => {
  res.json({ message: 'Token is valid' });
});

export default router;
