// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  loginLimiter,
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
} from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import {
  signupSchema,
  loginSchema,
  googleSignInSchema,
  linkGoogleSchema,
  changePasswordSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} from '../validators/authValidators';
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

router.post('/signup', validate(signupSchema), signup);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/google-signin', validate(googleSignInSchema), googleSignIn);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/verify', verifyToken);

// ==================== PROTECTED ROUTES ====================

router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, validate(updateProfileSchema), updateProfile);
router.post('/change-password', authenticateToken, validate(changePasswordSchema), changePassword);
router.post('/link-google', authenticateToken, validate(linkGoogleSchema), linkGoogleAccount);

// ==================== PASSWORD RESET ROUTES ====================

router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/verify-otp', verifyOtpLimiter, validate(verifyOtpSchema), verifyOTP);
router.post('/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/validate-token', validateResetToken);

export default router;