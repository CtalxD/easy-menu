// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { signup, login, logout, refreshToken, verifyToken } from '../controllers/authController';
import { forgotPassword, resetPassword, validateResetToken, verifyOTP } from '../controllers/passwordController';

const router = Router();

// Auth
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/verify', verifyToken);

// Password reset with OTP
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);
router.get('/validate-token', validateResetToken);

export default router;