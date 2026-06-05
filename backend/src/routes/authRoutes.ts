// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { signup, login, logout, refreshToken, verifyToken } from '../controllers/authController';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/verify', verifyToken);

export default router;