import { Router } from 'express';
import { registerUser, loginUser, getMe, updateMyProfile } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMyProfile);
router.post('/verify', authenticate, (_req, res) => {
  res.json({ message: 'Token is valid' });
});

export default router;
