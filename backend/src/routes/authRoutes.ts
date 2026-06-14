// backend/src/routes/authRoutes.ts

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  loginLimiter,
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
} from '../middleware/rateLimiter';
import { 
  signup, 
  login, 
  logout, 
  refreshToken, 
  verifyToken,
  googleSignIn,
  linkGoogleAccount,
  getCurrentUser,
  changePassword,
  updateProfile
} from '../controllers/authController';
import { 
  forgotPassword, 
  resetPassword, 
  validateResetToken, 
  verifyOTP 
} from '../controllers/passwordController';

const router = Router();

// ==================== AUTH ROUTES ====================

router.post('/signup', signup);
router.post('/login', loginLimiter, login);
router.post('/google-signin', googleSignIn);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/verify', verifyToken);

// ==================== PROTECTED ROUTES ====================

router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, changePassword);
router.post('/link-google', authenticateToken, linkGoogleAccount);

// ==================== PASSWORD RESET ROUTES ====================

router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/verify-otp', verifyOtpLimiter, verifyOTP);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.get('/validate-token', validateResetToken);

export default router;